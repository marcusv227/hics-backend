import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateSessionDto {
  @ApiPropertyOptional({ example: 'Dúvida sobre engasgo' })
  @IsOptional()
  @IsString()
  title?: string;
}
