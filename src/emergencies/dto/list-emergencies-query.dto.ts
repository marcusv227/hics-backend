import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ListEmergenciesQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por categoria' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Termo de busca por título ou resumo' })
  @IsOptional()
  @IsString()
  search?: string;
}
