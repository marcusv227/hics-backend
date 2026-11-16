import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CredentialStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DOCUMENT_STORAGE } from '../common/storage/storage.module';
import type { DocumentStorage } from '../common/storage/document-storage';
import { ManualCredentialVerifier } from '../common/credential-verifier';
import { UpdateCredentialDto } from './dto/update-credential.dto';

const EDITABLE_STATUSES: CredentialStatus[] = [CredentialStatus.NOT_SUBMITTED, CredentialStatus.REJECTED];
const ALLOWED_DOCUMENT_MIMES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

@Injectable()
export class ProfessionalsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(DOCUMENT_STORAGE) private readonly storage: DocumentStorage,
    private readonly verifier: ManualCredentialVerifier,
  ) {}

  async getMyCredential(userId: string) {
    const profile = await this.getOrCreateProfile(userId);
    return this.serialize(profile);
  }

  async updateMyCredential(userId: string, dto: UpdateCredentialDto) {
    const profile = await this.getOrCreateProfile(userId);
    this.assertEditable(profile.status);

    const updated = await this.prisma.professionalProfile.update({
      where: { userId },
      data: {
        council: dto.council,
        registrationNumber: dto.registrationNumber,
        uf: dto.uf,
        rejectionReason: null,
      },
    });

    return this.serialize(updated);
  }

  async saveDocument(userId: string, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Envie um arquivo PDF, JPG ou PNG de até 5 MB.');
    }
    if (!ALLOWED_DOCUMENT_MIMES.includes(file.mimetype)) {
      throw new BadRequestException('Formato inválido. Envie PDF, JPG ou PNG.');
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      throw new BadRequestException('Arquivo maior que 5 MB.');
    }

    const profile = await this.getOrCreateProfile(userId);
    this.assertEditable(profile.status);

    if (profile.documentKey) {
      await this.storage.delete(profile.documentKey).catch(() => undefined);
    }

    const stored = await this.storage.save(file.buffer, {
      subDir: `credentials/${profile.id}`,
      originalName: file.originalname,
      mime: file.mimetype,
    });

    await this.prisma.professionalProfile.update({
      where: { userId },
      data: {
        documentKey: stored.key,
        documentMime: stored.mime,
        documentSizeBytes: stored.sizeBytes,
      },
    });

    return { fileName: file.originalname, sizeBytes: stored.sizeBytes };
  }

  async submit(userId: string) {
    const profile = await this.getOrCreateProfile(userId);
    this.assertEditable(profile.status);

    const missing: string[] = [];
    if (!profile.council) missing.push('Selecione o conselho.');
    if (!profile.registrationNumber) missing.push('Informe o número.');
    if (!profile.uf) missing.push('UF inválida.');
    if (!profile.documentKey) missing.push('Anexe o documento do conselho.');

    if (missing.length > 0) {
      throw new BadRequestException({ statusCode: 400, code: 'CREDENTIAL_INCOMPLETE', missing });
    }

    if (profile.council && profile.registrationNumber && profile.uf) {
      await this.verifier.verify({
        council: profile.council,
        registrationNumber: profile.registrationNumber,
        uf: profile.uf,
      });
    }

    const updated = await this.prisma.professionalProfile.update({
      where: { userId },
      data: { status: CredentialStatus.PENDING, submittedAt: new Date() },
    });

    return this.serialize(updated);
  }

  private async getOrCreateProfile(userId: string) {
    const existing = await this.prisma.professionalProfile.findUnique({ where: { userId } });
    if (existing) {
      return existing;
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return this.prisma.professionalProfile.create({ data: { userId } });
  }

  private assertEditable(status: CredentialStatus) {
    if (!EDITABLE_STATUSES.includes(status)) {
      throw new ConflictException('Não é possível editar a credencial enquanto a verificação está em andamento ou já aprovada.');
    }
  }

  private serialize(profile: { council: string | null; registrationNumber: string | null; uf: string | null; status: CredentialStatus; rejectionReason: string | null; documentKey: string | null }) {
    return {
      council: profile.council,
      registrationNumber: profile.registrationNumber,
      uf: profile.uf,
      status: profile.status,
      rejectionReason: profile.rejectionReason,
      hasDocument: Boolean(profile.documentKey),
    };
  }
}
