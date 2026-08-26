import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'maria.silva@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'S3nhaForte!' })
  @IsString()
  @MinLength(6)
  password: string;
}
