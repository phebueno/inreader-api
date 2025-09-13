import { DocumentDto } from '@/documents/dto/document.dto';
import { ApiProperty } from '@nestjs/swagger';

export class TranscriptionDto {
  @ApiProperty({ example: '7b23f6c4-4d3a-4a1c-b1de-1234567890ab' })
  id: string;

  @ApiProperty({ type: DocumentDto })
  document: DocumentDto;

  @ApiProperty({ example: 'Texto extraído da imagem...' })
  text: string;

  @ApiProperty({ example: '2025-09-13T04:10:00.000Z' })
  createdAt: Date;
}
