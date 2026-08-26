import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'maria.silva@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'S3nhaForte!' })
  @IsString()
  @MinLength(6)
  password: string;
}
