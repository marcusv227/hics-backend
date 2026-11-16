import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminCredentialsController } from './admin-credentials.controller';
import { AdminCredentialsService } from './admin-credentials.service';
import { AdminSubmissionsController } from './admin-submissions.controller';
import { AdminSubmissionsService } from './admin-submissions.service';
import { DocumentAccessController } from './document-access.controller';
import { CredentialDocumentRetentionService } from './credential-document-retention.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [JwtModule.register({}), NotificationsModule],
  controllers: [AdminCredentialsController, AdminSubmissionsController, DocumentAccessController],
  providers: [AdminCredentialsService, AdminSubmissionsService, CredentialDocumentRetentionService],
})
export class AdminModule {}
