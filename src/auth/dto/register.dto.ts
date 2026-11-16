import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const REGISTERABLE_ROLES = [Role.USER, Role.HEALTH_PROFESSIONAL] as const;

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

  @ApiPropertyOptional({ enum: REGISTERABLE_ROLES, example: Role.USER, description: 'ADMIN não pode ser criado por aqui.' })
  @IsOptional()
  @IsIn(REGISTERABLE_ROLES)
  role?: typeof REGISTERABLE_ROLES[number];

  @ApiPropertyOptional({
    example: 'CRM 128734/RJ',
    description: 'Texto livre opcional com o registro no conselho profissional, pré-preenchido no perfil quando role=HEALTH_PROFESSIONAL. Os dados estruturados (conselho, número, UF) são confirmados depois em PUT /professionals/me/credential.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  professionalRegistration?: string;
}
