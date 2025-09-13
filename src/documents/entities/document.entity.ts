import { ApiProperty } from '@nestjs/swagger';

export class DocumentEntity {
  @ApiProperty({
    description: 'ID do documento',
    example: '2cc5b476-72a0-4636-9643-ddf0c09bf7d9',
  })
  id: string;

  @ApiProperty({
    description: 'ID do usuário dono do documento',
    example: 'e2d9ddeb-e516-4dd0-8d2a-150afc5ff9db',
  })
  userId: string;

  @ApiProperty({
    description: 'Caminho/local do arquivo no servidor',
    example: 'uploads/e3446355-fe78-4fbb-88a7-c5ce03eb7cce.png',
  })
  key: string;

  @ApiProperty({ description: 'Tipo MIME do arquivo', example: 'image/png' })
  mimeType: string;

  @ApiProperty({
    description: 'Status do processamento',
    example: 'PENDING',
    enum: ['PENDING', 'DONE', 'FAILED'],
  })
  status: string;

  @ApiProperty({
    description: 'Data do processamento (null se ainda não processado)',
    example: null,
    required: false,
  })
  processedAt?: Date | null;

  @ApiProperty({
    description: 'Data de criação do documento',
    example: '2025-09-13T04:02:20.917Z',
  })
  createdAt: Date;
}
