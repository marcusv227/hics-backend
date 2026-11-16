import { Controller, Get, NotFoundException, Param, Query, StreamableFile, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ApiExcludeController } from '@nestjs/swagger';
import { AdminCredentialsService } from './admin-credentials.service';

interface DocumentTokenPayload {
  sub: string;
  profileId: string;
}

/**
 * Deliberately NOT behind JwtAuthGuard: it is reached via a short-lived
 * signed URL (see AdminCredentialsService.getDocumentSignedUrl), typically
 * opened directly in a browser tab with no Authorization header.
 */
@ApiExcludeController()
@Controller('admin/credentials')
export class DocumentAccessController {
  constructor(
    private readonly adminCredentialsService: AdminCredentialsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Get(':id/document/raw')
  async getRawDocument(@Param('id') id: string, @Query('token') token?: string) {
    if (!token) {
      throw new UnauthorizedException('Token ausente.');
    }

    let payload: DocumentTokenPayload;
    try {
      payload = this.jwtService.verify<DocumentTokenPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Link expirado ou inválido.');
    }

    if (payload.sub !== 'credential-document' || payload.profileId !== id) {
      throw new UnauthorizedException('Link inválido para este documento.');
    }

    const { stream, mime, fileName } = await this.adminCredentialsService.streamDocument(id);
    if (!stream) {
      throw new NotFoundException('Documento não encontrado.');
    }

    return new StreamableFile(stream, { type: mime, disposition: `inline; filename="${fileName}"` });
  }
}
