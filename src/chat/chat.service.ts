import { ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SendMessageDto } from './dto/send-message.dto';

const HEALTH_DISCLAIMER = 'Caráter educativo. Em emergência real, acione o 192.';

interface N8nChatResponse {
  output?: string;
  sourcesCited?: unknown[];
}

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  createSession(userId: string, dto: CreateSessionDto) {
    return this.prisma.chatSession.create({
      data: {
        userId,
        title: dto.title ?? 'Atendimento de Orientação',
      },
    });
  }

  listSessions(userId: string) {
    return this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getMessages(sessionId: string, userId: string) {
    await this.assertSessionOwnership(sessionId, userId);
    return this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(userId: string, dto: SendMessageDto) {
    const session = await this.assertSessionOwnership(dto.sessionId, userId);

    const userMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        sender: 'user',
        content: dto.message,
      },
    });

    const aiReply = await this.forwardToN8n(session.id, dto.message);

    if (!aiReply.output) {
      throw new ServiceUnavailableException('Resposta inválida do serviço de IA.');
    }

    const aiMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        sender: 'assistant',
        content: aiReply.output,
        sourcesCited: (aiReply.sourcesCited ?? []) as Prisma.InputJsonValue,
      },
    });

    await this.prisma.chatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
    });

    return {
      userMessage,
      assistantMessage: aiMessage,
      disclaimer: HEALTH_DISCLAIMER,
    };
  }

  private async forwardToN8n(sessionId: string, message: string): Promise<N8nChatResponse> {
    const webhookUrl = this.configService.getOrThrow<string>('N8N_WEBHOOK_CHAT_URL');
    const timeout = this.configService.get<number>('N8N_WEBHOOK_TIMEOUT_MS', 15000);

    try {
      const response = await firstValueFrom(
        this.httpService.post<N8nChatResponse>(webhookUrl, { sessionId, message }, { timeout }),
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new ServiceUnavailableException(
        `Falha ao comunicar com o serviço de IA: ${axiosError.message}`,
      );
    }
  }

  private async assertSessionOwnership(sessionId: string, userId: string) {
    const session = await this.prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException('Sessão de atendimento não encontrada.');
    }
    if (session.userId !== userId) {
      throw new ForbiddenException('Você não tem acesso a esta sessão.');
    }
    return session;
  }
}
