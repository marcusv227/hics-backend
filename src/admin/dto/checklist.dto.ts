import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ChecklistDto {
  @ApiProperty() @IsBoolean() matchesSource: boolean;
  @ApiProperty() @IsBoolean() safeForLaypeople: boolean;
  @ApiProperty() @IsBoolean() clearLanguage: boolean;
  @ApiProperty() @IsBoolean() notDuplicate: boolean;
}
