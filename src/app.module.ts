import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './common/storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { EmergenciesModule } from './emergencies/emergencies.module';
import { TrainingsModule } from './trainings/trainings.module';
import { ChatModule } from './chat/chat.module';
import { SearchModule } from './search/search.module';
import { VideosModule } from './videos/videos.module';
import { ProfessionalsModule } from './professionals/professionals.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 120 }] }),
    PrismaModule,
    StorageModule,
    AuthModule,
    EmergenciesModule,
    TrainingsModule,
    ChatModule,
    SearchModule,
    VideosModule,
    ProfessionalsModule,
    SubmissionsModule,
    NotificationsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
