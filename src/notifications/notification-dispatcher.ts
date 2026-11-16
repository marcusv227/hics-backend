import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface DispatchNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface NotificationDispatcher {
  dispatch(input: DispatchNotificationInput): Promise<void>;
}

/** Only writes the in-app row. Swap for a push-enabled dispatcher (FCM, etc.) later without touching callers. */
@Injectable()
export class InAppOnlyDispatcher implements NotificationDispatcher {
  constructor(private readonly prisma: PrismaService) {}

  async dispatch(input: DispatchNotificationInput): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
