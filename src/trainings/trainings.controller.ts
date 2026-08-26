import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/decorators/current-user.decorator';
import { TrainingsService } from './trainings.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

@ApiTags('trainings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trainings')
export class TrainingsController {
  constructor(private readonly trainingsService: TrainingsService) {}

  @Get('tracks')
  listTracks(@CurrentUser() user: RequestUser) {
    return this.trainingsService.listTracks(user.userId);
  }

  @Get('tracks/:id')
  getTrack(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.trainingsService.getTrack(id, user.userId);
  }

  @Post('tracks/:id/submit-quiz')
  submitQuiz(@Param('id') id: string, @CurrentUser() user: RequestUser, @Body() dto: SubmitQuizDto) {
    return this.trainingsService.submitQuiz(id, user.userId, dto);
  }
}
