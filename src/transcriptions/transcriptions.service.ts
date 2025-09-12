import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TranscriptionsService {
  constructor(private prisma: PrismaService) {}

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
    if (existing) {
      throw new ConflictException(
        'Transcription already exists for this document',
      );
    }

    const fakeText = `Transcrição do documento ${documentId} - arquivo ${document.key}`;

    const transcription = await this.prisma.transcription.create({
      data: {
        documentId: document.id,
        text: fakeText,
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
      throw new ForbiddenException('You cannot access a transcription for a document that is not yours');
    }

    return this.prisma.transcription.findUnique({
      where: { documentId },
    });
  }
}
