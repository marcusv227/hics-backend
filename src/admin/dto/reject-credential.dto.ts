import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RejectCredentialDto {
  @ApiProperty({ example: 'Documento ilegível, envie uma foto mais nítida.' })
  @IsString()
  @MinLength(3)
  reason: string;
}
