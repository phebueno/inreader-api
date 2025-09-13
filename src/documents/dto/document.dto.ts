import { ApiProperty } from '@nestjs/swagger';
import { DocumentStatus } from '@prisma/client';

export class DocumentDto {
  @ApiProperty({ example: '2cc5b476-72a0-4636-9643-ddf0c09bf7d9' })
  id: string;

  @ApiProperty({ example: 'e2d9ddeb-e516-4dd0-8d2a-150afc5ff9db' })
  userId: string;

  @ApiProperty({ example: 'uploads/e3446355-fe78-4fbb-88a7-c5ce03eb7cce.png' })
  key: string;

  @ApiProperty({ example: 'image/png' })
  mimeType: string;

  @ApiProperty({ enum: DocumentStatus, example: DocumentStatus.PENDING })
  status: DocumentStatus;

  @ApiProperty({ example: null, nullable: true })
  processedAt?: Date | null;

  @ApiProperty({ example: '2025-09-13T04:02:20.917Z' })
  createdAt: Date;
}
