import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { createWorker } from 'tesseract.js';

@Injectable()
export class TranscriptionsService {
  constructor(private prisma: PrismaService) {}

  private async extractTextFromImage(filePath: string) {
    const path = require('path');
    const fs = require('fs');

    const fullPath = path.join(__dirname, '..', '..', filePath);

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException(`File not found at path: ${fullPath}`);
    }

    const worker = await createWorker('por');
    const ret = await worker.recognize(fullPath);
    await worker.terminate();

    return ret.data.text;
  }

  async transcribeDocument(userId: string, documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) throw new NotFoundException('Document not found');

    if (document.userId !== userId) {
      throw new ForbiddenException(
        'You cannot transcribe a document that is not yours',
      );
    }

    const existing = await this.prisma.transcription.findUnique({
      where: { documentId },
    });
    if (existing && document.status === 'DONE') {
      throw new ConflictException(
        'Transcription already exists for this document',
      );
    }

    const text = await this.extractTextFromImage(document.key);

    const transcription = await this.prisma.transcription.create({
      data: {
        documentId: document.id,
        text,
      },
    });

    return transcription;
  }

  async getByDocument(userId: string, documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) throw new NotFoundException('Document not found');

    if (document.userId !== userId) {
      throw new ForbiddenException(
        'You cannot access a transcription for a document that is not yours',
      );
    }

    return this.prisma.transcription.findUnique({
      where: { documentId },
    });
  }
}
