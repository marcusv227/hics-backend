import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'S3nhaAtual!' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'S3nhaNova!' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
