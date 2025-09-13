import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateAiCompletionDto {
  @ApiProperty({ example: 'Resuma este texto em 3 linhas.' })
  @IsString()
  @MinLength(1, { message: 'O prompt não pode ser vazio' })
  prompt: string;
}