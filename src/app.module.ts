import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmergenciesModule } from './emergencies/emergencies.module';
import { TrainingsModule } from './trainings/trainings.module';
import { ChatModule } from './chat/chat.module';
import { SearchModule } from './search/search.module';
import { VideosModule } from './videos/videos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    EmergenciesModule,
    TrainingsModule,
    ChatModule,
    SearchModule,
    VideosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
