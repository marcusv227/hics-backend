import { Body, Controller, Get, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/decorators/current-user.decorator';
import { ProfessionalsService } from './professionals.service';
import { UpdateCredentialDto } from './dto/update-credential.dto';

@ApiTags('professionals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('professionals/me/credential')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Get()
  getCredential(@CurrentUser() user: RequestUser) {
    return this.professionalsService.getMyCredential(user.userId);
  }

  @Put()
  updateCredential(@CurrentUser() user: RequestUser, @Body() dto: UpdateCredentialDto) {
    return this.professionalsService.updateMyCredential(user.userId, dto);
  }

  @Post('document')
  @ApiConsumes('multipart/form-data')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  uploadDocument(@CurrentUser() user: RequestUser, @UploadedFile() file?: Express.Multer.File) {
    return this.professionalsService.saveDocument(user.userId, file);
  }

  @Post('submit')
  submit(@CurrentUser() user: RequestUser) {
    return this.professionalsService.submit(user.userId);
  }
}
