import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { InAppOnlyDispatcher } from './notification-dispatcher';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, InAppOnlyDispatcher],
  exports: [NotificationsService],
})
export class NotificationsModule {}
