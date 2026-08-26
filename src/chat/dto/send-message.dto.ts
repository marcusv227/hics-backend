import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: 'ID da sessão de atendimento' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ example: 'Como faço a manobra de Heimlich em um bebê?' })
  @IsString()
  @MinLength(1)
  message: string;
}
