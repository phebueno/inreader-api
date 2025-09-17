import * as path from 'path';
import * as fs from 'fs';

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createWorker } from 'tesseract.js';

import { PrismaService } from '@/prisma/prisma.service';
import { SupabaseService } from '@/supabase/supabase.service';

@Injectable()
export class TranscriptionsService {
  constructor(private prisma: PrismaService,
    private supabaseService: SupabaseService
  ) {}

  private async extractTextFromImage(key: string) {
    try {
      const buffer = await this.supabaseService.downloadFile(key);      

      const worker = await createWorker('por');
      const ret = await worker.recognize(buffer);
      await worker.terminate();

      return ret.data.text;
    } catch (error) {
      throw new Error('Transcription failed!');
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
