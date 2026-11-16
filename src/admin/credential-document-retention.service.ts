import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { CredentialStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DOCUMENT_STORAGE } from '../common/storage/storage.module';
import type { DocumentStorage } from '../common/storage/document-storage';

const RETENTION_DAYS = 90;
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

/**
 * LGPD: the council-registration document is sensitive personal data.
 * Once a credential decision has stood for 90 days, the file itself is
 * no longer needed (the decision and its audit trail are) — delete it.
 *
 * Plain setInterval rather than @nestjs/schedule: that package ships
 * ESM-only as of v12, which ts-jest (CommonJS) cannot require() — not
 * worth the build/test friction for a once-a-day housekeeping job.
 */
@Injectable()
export class CredentialDocumentRetentionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CredentialDocumentRetentionService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(DOCUMENT_STORAGE) private readonly storage: DocumentStorage,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      this.purgeExpiredDocuments().catch((error) => this.logger.error('Falha na rotina de retenção de documentos', error));
    }, CHECK_INTERVAL_MS);
  }

  onModuleDestroy() {
    clearInterval(this.timer);
  }

  async purgeExpiredDocuments(): Promise<number> {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const expired = await this.prisma.professionalProfile.findMany({
      where: {
        status: { in: [CredentialStatus.APPROVED, CredentialStatus.REJECTED] },
        reviewedAt: { lt: cutoff },
        documentKey: { not: null },
      },
      select: { id: true, documentKey: true },
    });

    for (const profile of expired) {
      if (!profile.documentKey) continue;
      await this.storage.delete(profile.documentKey).catch((error) =>
        this.logger.warn(`Falha ao remover documento ${profile.documentKey}: ${error}`),
      );
      await this.prisma.professionalProfile.update({
        where: { id: profile.id },
        data: { documentKey: null, documentMime: null, documentSizeBytes: null },
      });
    }

    if (expired.length > 0) {
      this.logger.log(`${expired.length} documento(s) de credencial removidos por retenção (90 dias).`);
    }
    return expired.length;
  }
}
