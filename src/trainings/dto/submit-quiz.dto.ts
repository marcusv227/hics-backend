import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsUUID, ValidateNested } from 'class-validator';

export class QuizAnswerDto {
  @ApiProperty({ description: 'ID da pergunta' })
  @IsUUID()
  questionId: string;

  @ApiProperty({ description: 'ID da opção escolhida' })
  @IsUUID()
  optionId: string;
}

export class SubmitQuizDto {
  @ApiProperty({ type: [QuizAnswerDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers: QuizAnswerDto[];
}
