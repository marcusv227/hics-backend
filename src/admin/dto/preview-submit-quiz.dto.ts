import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, Min, ValidateNested } from 'class-validator';

export class PreviewQuizAnswerDto {
  @ApiProperty({ description: 'Índice da pergunta no array payload.questions' })
  @IsInt()
  @Min(0)
  questionIndex: number;

  @ApiProperty({ description: 'Índice da opção escolhida (0 a 3)' })
  @IsInt()
  @Min(0)
  optionIndex: number;
}

export class PreviewSubmitQuizDto {
  @ApiProperty({ type: [PreviewQuizAnswerDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PreviewQuizAnswerDto)
  answers: PreviewQuizAnswerDto[];
}
