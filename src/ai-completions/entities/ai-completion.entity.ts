import { ApiProperty } from '@nestjs/swagger';
import { AiCompletion } from '@prisma/client';

export class AiCompletionEntity implements AiCompletion {
  @ApiProperty({ example: 'd8f5c7a1-3f2b-4a5e-8f2a-1b2c3d4e5f6g' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab' })
  transcriptionId: string;

  @ApiProperty({ example: 'Resuma o texto da transcription em 3 linhas' })
  prompt: string;

  @ApiProperty({ example: 'Este é um resumo do texto da transcription fornecida...' })
  response: string;

  @ApiProperty({ example: 45, required: false })
  tokensUsed: number;

  @ApiProperty({ example: '2025-09-13T05:12:34.567Z' })
  createdAt: Date;
}