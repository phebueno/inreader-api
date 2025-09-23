import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createWorker } from 'tesseract.js';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

import { PrismaService } from '@/prisma/prisma.service';
import { SupabaseService } from '@/supabase/supabase.service';

@Injectable()
export class TranscriptionsService {
  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
  ) {}

  private async extractTextFromPdf(
    buffer: Buffer<ArrayBufferLike>,
  ): Promise<string> {
    try {
      const uint8Array = new Uint8Array(buffer);
      const pdfDocument = await getDocument({ data: uint8Array }).promise;

      let extractedText = '';
      for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        extractedText += pageText + '\n';
      }

      return extractedText;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  private async extractTextFromImage(
    buffer: Buffer<ArrayBufferLike>,
  ): Promise<string> {
    try {
      const worker = await createWorker('por');
      const result = await worker.recognize(buffer);
      await worker.terminate();
      return result.data.text;
    } catch (error) {
      console.error('Image OCR error:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  async getVerifiedTranscription(userId: string, transcriptionId: string) {
    const transcription = await this.prisma.transcription.findUnique({
      where: { id: transcriptionId },
      include: { document: true },
    });

    if (!transcription) throw new NotFoundException('Transcription not found');
    if (transcription.document.userId !== userId) {
      throw new ForbiddenException('You do not own this transcription');
    }

    return transcription;
  }

  async transcribeDocument(userId: string, documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) throw new NotFoundException('Document not found');
    if (document.userId !== userId) {
      throw new ForbiddenException('You cannot transcribe this document');
    }

    const existing = await this.prisma.transcription.findUnique({
      where: { documentId },
    });
    if (existing && document.status === 'DONE') {
      throw new ConflictException('Transcription already exists');
    }

    try {
      // 🔹 baixa o buffer só uma vez
      const buffer = await this.supabaseService.downloadFile(document.key);

      let text = '';
      if (document.mimeType === 'application/pdf') {
        text = await this.extractTextFromPdf(buffer);
      } else {
        text = await this.extractTextFromImage(buffer);
      }

      const transcription = await this.prisma.transcription.create({
        data: {
          documentId: document.id,
          text,
        },
      });

      return transcription;
    } catch (error) {
      console.error('Transcription process error:', error);
      throw new Error('Transcription failed!');
    }
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
