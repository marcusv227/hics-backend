import { ApiProperty } from '@nestjs/swagger';
import { ProfessionalCouncil } from '@prisma/client';
import { IsEnum, IsString, Matches } from 'class-validator';

export const BRAZILIAN_UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export class UpdateCredentialDto {
  @ApiProperty({ enum: ProfessionalCouncil, example: ProfessionalCouncil.COREN })
  @IsEnum(ProfessionalCouncil)
  council: ProfessionalCouncil;

  @ApiProperty({ example: '245871', description: 'Somente dígitos e ponto, até 10 caracteres.' })
  @IsString()
  @Matches(/^[0-9.]{1,10}$/, { message: 'Número de registro inválido.' })
  registrationNumber: string;

  @ApiProperty({ example: 'SP', enum: BRAZILIAN_UFS })
  @IsString()
  @Matches(new RegExp(`^(${BRAZILIAN_UFS.join('|')})$`), { message: 'UF inválida.' })
  uf: string;
}
