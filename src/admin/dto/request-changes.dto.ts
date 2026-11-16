import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsIn, IsString, MinLength } from 'class-validator';

export const CHANGE_REASONS = [
  'Fonte incorreta ou ausente',
  'Passo clinicamente impreciso',
  'Linguagem pouco clara',
  'Mídia inadequada',
  'Duplica conteúdo publicado',
] as const;

export class RequestChangesDto {
  @ApiProperty({ type: [String], enum: CHANGE_REASONS })
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(CHANGE_REASONS, { each: true })
  reasons: string[];

  @ApiProperty({ example: 'Inclua o tempo mínimo de lavagem (15 minutos).' })
  @IsString()
  @MinLength(3)
  note: string;
}
