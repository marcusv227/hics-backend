import { ApiProperty } from '@nestjs/swagger';
import { ContentType } from '@prisma/client';
import { IsEnum, IsObject } from 'class-validator';

export enum SubmissionAction {
  SAVE_DRAFT = 'SAVE_DRAFT',
  SUBMIT = 'SUBMIT',
}

export class CreateSubmissionDto {
  @ApiProperty({ enum: ContentType })
  @IsEnum(ContentType)
  type: ContentType;

  @ApiProperty({ enum: SubmissionAction })
  @IsEnum(SubmissionAction)
  action: SubmissionAction;

  @ApiProperty({ type: Object, description: 'Payload específico do tipo — ver documentação de cada ContentType.' })
  @IsObject()
  payload: Record<string, unknown>;
}
