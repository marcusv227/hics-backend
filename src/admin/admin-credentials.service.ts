import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CredentialStatus, NotificationType } from '@prisma/client';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { DOCUMENT_STORAGE } from '../common/storage/storage.module';
import type { DocumentStorage } from '../common/storage/document-storage';
import { NotificationsService } from '../notifications/notifications.service';
import { RejectCredentialDto } from './dto/reject-credential.dto';

const DOCUMENT_URL_TTL_SECONDS = 5 * 60;

@Injectable()
export class AdminCredentialsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(DOCUMENT_STORAGE) private readonly storage: DocumentStorage,
    private readonly notifications: NotificationsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async list(status?: CredentialStatus) {
    const profiles = await this.prisma.professionalProfile.findMany({
      where: status ? { status } : undefined,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { submittedAt: 'asc' },
    });

    return profiles.map((p) => ({
      id: p.id,
      user: p.user,
      council: p.council,
      registrationNumber: p.registrationNumber,
      uf: p.uf,
      status: p.status,
      submittedAt: p.submittedAt,
      hasDocument: Boolean(p.documentKey),
    }));
  }

  async getDocumentSignedUrl(profileId: string) {
    const profile = await this.prisma.professionalProfile.findUnique({ where: { id: profileId } });
    if (!profile || !profile.documentKey) {
      throw new NotFoundException('Documento não encontrado.');
    }

    const token = this.jwtService.sign(
      { sub: 'credential-document', profileId },
      { secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'), expiresIn: DOCUMENT_URL_TTL_SECONDS },
    );

    return {
      url: `/api/v1/admin/credentials/${profileId}/document/raw?token=${token}`,
      expiresAt: new Date(Date.now() + DOCUMENT_URL_TTL_SECONDS * 1000),
    };
  }

  /** Called by the unguarded raw-document controller after it verifies the token itself. */
  async streamDocument(profileId: string) {
    const profile = await this.prisma.professionalProfile.findUnique({ where: { id: profileId } });
    if (!profile || !profile.documentKey) {
      throw new NotFoundException('Documento não encontrado.');
    }
    return {
      stream: await this.storage.getReadStream(profile.documentKey),
      mime: profile.documentMime ?? 'application/octet-stream',
      fileName: path.basename(profile.documentKey),
    };
  }

  async approve(adminId: string, profileId: string) {
    const profile = await this.transitionStatus(profileId, CredentialStatus.APPROVED, {
      reviewedById: adminId,
      reviewedAt: new Date(),
      rejectionReason: null,
    });

    await this.notifications.notify({
      userId: profile.userId,
      type: NotificationType.CREDENTIAL_APPROVED,
      title: 'Registro verificado',
      body: 'Registro verificado. Criação de conteúdo liberada.',
    });

    await this.prisma.auditLog.create({
      data: { actorId: adminId, action: 'CREDENTIAL_APPROVE', entity: 'ProfessionalProfile', entityId: profileId },
    });

    return profile;
  }

  async reject(adminId: string, profileId: string, dto: RejectCredentialDto) {
    const profile = await this.transitionStatus(profileId, CredentialStatus.REJECTED, {
      reviewedById: adminId,
      reviewedAt: new Date(),
      rejectionReason: dto.reason,
    });

    await this.notifications.notify({
      userId: profile.userId,
      type: NotificationType.CREDENTIAL_REJECTED,
      title: 'Registro não aprovado',
      body: dto.reason,
    });

    await this.prisma.auditLog.create({
      data: { actorId: adminId, action: 'CREDENTIAL_REJECT', entity: 'ProfessionalProfile', entityId: profileId, meta: { reason: dto.reason } },
    });

    return profile;
  }

  private async transitionStatus(
    profileId: string,
    nextStatus: CredentialStatus,
    data: { reviewedById: string; reviewedAt: Date; rejectionReason: string | null },
  ) {
    const result = await this.prisma.professionalProfile.updateMany({
      where: { id: profileId, status: CredentialStatus.PENDING },
      data: { status: nextStatus, ...data },
    });

    if (result.count === 0) {
      const exists = await this.prisma.professionalProfile.findUnique({ where: { id: profileId } });
      if (!exists) {
        throw new NotFoundException('Credencial não encontrada.');
      }
      throw new ConflictException({ statusCode: 409, code: 'INVALID_STATUS', message: 'Esta credencial já foi revisada.' });
    }

    return this.prisma.professionalProfile.findUniqueOrThrow({ where: { id: profileId } });
  }
}
