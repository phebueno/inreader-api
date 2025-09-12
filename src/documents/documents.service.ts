import { Injectable } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { promises as fs } from 'fs';
import { join } from 'path';
import { TranscriptionsService } from 'src/transcriptions/transcriptions.service';
import { TranscriptionsGateway } from 'src/transcriptions/transcriptions.gateway';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private transcriptionsService: TranscriptionsService,
    private gateway: TranscriptionsGateway,
  ) {}

  async createDocument(userId: string, file: Express.Multer.File) {
    const filename = `${Date.now()}-${file.originalname}`;
    const localPath = join('uploads', filename);

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

  findAll() {
    return `This action returns all documents`;
  }

  findOne(id: number) {
    return `This action returns a #${id} document`;
  }

  update(id: number, updateDocumentDto: UpdateDocumentDto) {
    return `This action updates a #${id} document`;
  }

  remove(id: number) {
    return `This action removes a #${id} document`;
  }
}
