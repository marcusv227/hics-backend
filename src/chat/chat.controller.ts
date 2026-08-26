import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sessions')
  createSession(@CurrentUser() user: RequestUser, @Body() dto: CreateSessionDto) {
    return this.chatService.createSession(user.userId, dto);
  }

  @Get('sessions')
  listSessions(@CurrentUser() user: RequestUser) {
    return this.chatService.listSessions(user.userId);
  }

  @Get('sessions/:id/messages')
  getMessages(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.chatService.getMessages(id, user.userId);
  }

  @Post('message')
  sendMessage(@CurrentUser() user: RequestUser, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(user.userId, dto);
  }
}
