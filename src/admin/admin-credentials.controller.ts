import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CredentialStatus, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/decorators/current-user.decorator';
import { AdminCredentialsService } from './admin-credentials.service';
import { RejectCredentialDto } from './dto/reject-credential.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/credentials')
export class AdminCredentialsController {
  constructor(private readonly adminCredentialsService: AdminCredentialsService) {}

  @Get()
  list(@Query('status') status?: CredentialStatus) {
    return this.adminCredentialsService.list(status);
  }

  @Get(':id/document')
  getDocumentUrl(@Param('id') id: string) {
    return this.adminCredentialsService.getDocumentSignedUrl(id);
  }

  @Post(':id/approve')
  approve(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.adminCredentialsService.approve(user.userId, id);
  }

  @Post(':id/reject')
  reject(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: RejectCredentialDto) {
    return this.adminCredentialsService.reject(user.userId, id, dto);
  }
}
