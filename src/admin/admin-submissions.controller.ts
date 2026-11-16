import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ContentType, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/decorators/current-user.decorator';
import { AdminSubmissionsService } from './admin-submissions.service';
import { ChecklistDto } from './dto/checklist.dto';
import { RequestChangesDto } from './dto/request-changes.dto';
import { PreviewSubmitQuizDto } from './dto/preview-submit-quiz.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/submissions')
export class AdminSubmissionsController {
  constructor(private readonly adminSubmissionsService: AdminSubmissionsService) {}

  @Get()
  list(@Query('tab') tab: 'pending' | 'done' = 'pending', @Query('type') type?: ContentType) {
    return this.adminSubmissionsService.list(tab, type);
  }

  @Get(':id')
  getDetail(@Param('id') id: string) {
    return this.adminSubmissionsService.getDetail(id);
  }

  @Get(':id/preview')
  preview(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.adminSubmissionsService.preview(user.userId, id);
  }

  @Post(':id/preview/submit-quiz')
  previewSubmitQuiz(@Param('id') id: string, @Body() dto: PreviewSubmitQuizDto) {
    return this.adminSubmissionsService.previewSubmitQuiz(id, dto);
  }

  @Patch(':id/checklist')
  patchChecklist(@Param('id') id: string, @Body() dto: ChecklistDto) {
    return this.adminSubmissionsService.patchChecklist(id, dto);
  }

  @Post(':id/approve')
  approve(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.adminSubmissionsService.approve(user.userId, id);
  }

  @Post(':id/request-changes')
  requestChanges(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: RequestChangesDto) {
    return this.adminSubmissionsService.requestChanges(user.userId, id, dto);
  }
}
