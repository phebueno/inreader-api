import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { API_GEMINI_KEY } from 'src/constants/constants';
import { PrismaService } from 'src/prisma/prisma.service';
import { createWorker } from 'tesseract.js';

@Injectable()
export class TranscriptionsService {
  private genAI: GoogleGenerativeAI;

  constructor(private prisma: PrismaService) {
    this.genAI = new GoogleGenerativeAI(API_GEMINI_KEY);
  }

  private async interpretWithGemini(text: string, prompt = 'Resuma o seguinte texto em tópicos claros e objetivos:') {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(`${prompt}\n\n${text}`);
    const response = await result.response;

    return response.text();
  }

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

    const interpretation = await this.interpretWithGemini(text);

    console.log(interpretation)

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
