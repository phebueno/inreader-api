import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';
import { TranscriptionsGateway } from '@/transcriptions/transcriptions.gateway';
import { TranscriptionsService } from '@/transcriptions/transcriptions.service';
import { DocumentDto } from '@/documents/dto/document.dto';
import { SupabaseService } from '@/supabase/supabase.service';
import { appendTranscriptionToPdf, generatePdfFromImageAndTranscription } from '@/utils/pdf.utils';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
    private transcriptionsService: TranscriptionsService,
    private gateway: TranscriptionsGateway,
  ) {}

  async createDocument(userId: string, file: Express.Multer.File) {
    const key = await this.supabaseService.uploadFile(file);

    try {
      const doc = await this.prisma.document.create({
        data: {
          userId,
          key,
          mimeType: file.mimetype,
          status: 'PENDING',
        },
      });

      this.processTranscription(doc, userId);

      return { ...doc };
    } catch (fileError) {
      console.error('Upload failed', fileError);
      throw fileError;
    }
  }

  private async processTranscription(doc: DocumentDto, userId: string) {
    try {
      const transcription = await this.transcriptionsService.transcribeDocument(
        userId,
        doc.id,
      );

      await this.prisma.document.update({
        where: { id: doc.id },
        data: { status: 'DONE', processedAt: new Date() },
      });

      this.gateway.sendTranscriptionUpdate(userId, {
        documentId: doc.id,
        status: 'DONE',
        transcription,
      });
    } catch (err) {
      await this.prisma.document.update({
        where: { id: doc.id },
        data: { status: 'FAILED' },
      });

      this.gateway.sendTranscriptionUpdate(userId, {
        documentId: doc.id,
        status: 'FAILED',
        error: err.message,
      });
    }
  }

  async findAll(userId: string) {
    return this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!doc || doc.userId !== userId) {
      throw new NotFoundException(`Document #${id} not found`);
    }

    return doc;
  }

  async findOneDeep(id: string, userId: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        transcription: {
          include: {
            aiCompletions: true,
          },
        },
      },
    });

    if (!doc || doc.userId !== userId) {
      throw new NotFoundException(`Document #${id} not found`);
    }

    return doc;
  }

  async getDocumentStream(
    id: string,
    userId: string,
    options?: { original?: boolean },
  ) {
    const doc = await this.findOneDeep(id, userId);
    const buffer = await this.supabaseService.downloadFile(doc.key);

    if (options?.original) {
      return {
        buffer,
        mimeType: doc.mimeType,
        filename: doc.key,
      };
    }

    let pdfBuffer: Buffer;

    if (doc.mimeType === 'application/pdf') {
      pdfBuffer = await appendTranscriptionToPdf(buffer, doc);
    } else {
      pdfBuffer = await generatePdfFromImageAndTranscription(buffer, doc);
    }

    return {
      buffer: pdfBuffer,
      mimeType: 'application/pdf',
      filename: doc.key.replace(/\.(jpg|jpeg|png)$/i, '.pdf'),
    };
  }

  async remove(id: string, userId: string) {
    const doc = await this.findOne(id, userId);

    await this.supabaseService.deleteFile(doc.key);

    return this.prisma.document.delete({
      where: { id: doc.id },
    });
  }
}
