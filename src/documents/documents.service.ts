import { Injectable, NotFoundException } from '@nestjs/common';

import { UpdateDocumentDto } from '@/documents/dto/update-document.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { TranscriptionsGateway } from '@/transcriptions/transcriptions.gateway';
import { TranscriptionsService } from '@/transcriptions/transcriptions.service';
import { join } from 'path';
import { createReadStream, existsSync } from 'fs';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private transcriptionsService: TranscriptionsService,
    private gateway: TranscriptionsGateway,
  ) {}

  async createDocument(userId: string, file: Express.Multer.File) {
    const localPath = file.path;

    try {
      const doc = await this.prisma.document.create({
        data: {
          userId,
          key: localPath,
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

  private async processTranscription(doc: any, userId: string) {
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

  async getDocumentStream(id: string, userId: string) {
    const doc = await this.findOne(id, userId);

    const filePath = join(process.cwd(), doc.key);

    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }
    //TODO: add appending info

    return {
      stream: createReadStream(filePath),
      mimeType: doc.mimeType,
      filename: doc.key,
    };
  }

  async update(id: string, dto: UpdateDocumentDto, userId: string) {
    const doc = await this.findOne(id, userId);

    return this.prisma.document.update({
      where: { id: doc.id },
      data: { ...dto },
    });
  }

  async remove(id: string, userId: string) {
    const doc = await this.findOne(id, userId);

    return this.prisma.document.delete({
      where: { id: doc.id },
    });
  }
}
