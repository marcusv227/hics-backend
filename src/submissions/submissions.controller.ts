import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SubmissionStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VerifiedProfessionalGuard } from '../auth/guards/verified-professional.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/decorators/current-user.decorator';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';

@ApiTags('submissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VerifiedProfessionalGuard)
@Controller()
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post('submissions')
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateSubmissionDto) {
    return this.submissionsService.create(user.userId, dto);
  }

  @Get('submissions/mine')
  listMine(@CurrentUser() user: RequestUser, @Query('status') status?: SubmissionStatus) {
    return this.submissionsService.listMine(user.userId, status);
  }

  @Get('submissions/mine/:id')
  getMine(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.submissionsService.getMine(user.userId, id);
  }
}
