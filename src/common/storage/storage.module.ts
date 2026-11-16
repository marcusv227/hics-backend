import { Global, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentStorage, LocalDiskDocumentStorage, S3DocumentStorage } from './document-storage';

export const DOCUMENT_STORAGE = Symbol('DOCUMENT_STORAGE');

const documentStorageProvider: Provider = {
  provide: DOCUMENT_STORAGE,
  inject: [ConfigService],
  useFactory: (config: ConfigService): DocumentStorage => {
    const endpoint = config.get<string>('S3_ENDPOINT');
    if (!endpoint) {
      return new LocalDiskDocumentStorage();
    }
    return new S3DocumentStorage({
      endpoint,
      bucket: config.get<string>('S3_BUCKET', 'hics-documents'),
      accessKeyId: config.getOrThrow<string>('S3_ACCESS_KEY'),
      secretAccessKey: config.getOrThrow<string>('S3_SECRET_KEY'),
      region: config.get<string>('S3_REGION', 'us-east-1'),
    });
  },
};

/**
 * Global so every module can inject DOCUMENT_STORAGE without re-declaring
 * this provider — same pattern as PrismaModule.
 */
@Global()
@Module({
  providers: [documentStorageProvider],
  exports: [DOCUMENT_STORAGE],
})
export class StorageModule {}
