import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';
import { TranscriptionsGateway } from '@/transcriptions/transcriptions.gateway';
import { TranscriptionsService } from '@/transcriptions/transcriptions.service';
import { extname, join } from 'path';
import { createReadStream, existsSync, promises as fs } from 'fs';
import { unlink } from 'fs/promises';
import { DocumentDto } from '@/documents/dto/document.dto';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { SupabaseService } from '@/supabase/supabase.service';

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
    const filePath = join(process.cwd(), doc.key);

    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    if (options?.original) {
      return {
        stream: createReadStream(filePath),
        mimeType: doc.mimeType,
        filename: doc.key,
      };
    }

    const imageBytes = await fs.readFile(filePath);
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const page1 = pdfDoc.addPage();
    const pageWidth = page1.getWidth();
    const pageHeight = page1.getHeight();
    const margin = 50;

    let imageEmbed;
    if (doc.mimeType === 'image/png')
      imageEmbed = await pdfDoc.embedPng(imageBytes);
    else imageEmbed = await pdfDoc.embedJpg(imageBytes);

    const { width: imgWidth, height: imgHeight } = imageEmbed.scaleToFit(
      pageWidth - 2 * margin,
      pageHeight - 2 * margin,
    );
    const imgX = pageWidth / 2 - imgWidth / 2;
    const imgY = pageHeight - imgHeight - margin;

    page1.drawImage(imageEmbed, {
      x: imgX,
      y: imgY,
      width: imgWidth,
      height: imgHeight,
    });

    const transcriptionText = doc.transcription?.text || '';
    if (transcriptionText) {
      const page2 = pdfDoc.addPage();
      const fontSize = 12;
      let cursorY = page2.getHeight() - margin;

      page2.drawText('Transcrição:', { x: margin, y: cursorY, size: 16, font });
      cursorY -= fontSize * 2;

      page2.drawText(transcriptionText, {
        x: margin,
        y: cursorY,
        size: fontSize,
        font,
        maxWidth: page2.getWidth() - 2 * margin,
        lineHeight: fontSize * 1.2,
      });
    }

    const completions = doc.transcription?.aiCompletions || [];
    if (completions.length > 0) {
      let page = pdfDoc.addPage();
      const fontSize = 12;
      let cursorY = page.getHeight() - margin;

      const lineHeight = fontSize * 1.2;

      for (let i = 0; i < completions.length; i++) {
        const { prompt, response } = completions[i];

        const promptText = `Pergunta ${i + 1}: ${prompt}`;
        const responseText = `Resposta: ${response}`;

        const wrapText = (text: string, maxWidth: number) => {
          const words = text.split(' ');
          const lines: string[] = [];
          let line = '';
          for (const word of words) {
            const testLine = line ? `${line} ${word}` : word;
            const width = font.widthOfTextAtSize(testLine, fontSize);
            if (width > maxWidth) {
              lines.push(line);
              line = word;
            } else {
              line = testLine;
            }
          }
          if (line) lines.push(line);
          return lines;
        };

        const promptLines = wrapText(
          promptText.replace(/\n/g, ' '),
          page.getWidth() - 2 * margin,
        );
        const responseLines = wrapText(
          responseText.replace(/\n/g, ' '),
          page.getWidth() - 2 * margin,
        );

        for (const line of [...promptLines, ...responseLines, '']) {
          if (cursorY < margin) {
            page = pdfDoc.addPage();
            cursorY = page.getHeight() - margin;
          }
          page.drawText(line, {
            x: margin,
            y: cursorY,
            size: fontSize,
            font,
            lineHeight,
          });
          cursorY -= lineHeight;
        }
      }
    }

    const pdfBytes = await pdfDoc.save();

    return {
      buffer: Buffer.from(pdfBytes),
      mimeType: 'application/pdf',
      filename: doc.key.replace(/\.(jpg|jpeg|png)$/i, '.pdf'),
    };
  }

  async remove(id: string, userId: string) {
    const doc = await this.findOne(id, userId);
    const filePath = join(process.cwd(), doc.key);

    if (existsSync(filePath)) {
      try {
        await unlink(filePath);
      } catch (err) {
        console.error(`Erro ao deletar o arquivo ${filePath}:`, err);
      }
    }

    return this.prisma.document.delete({
      where: { id: doc.id },
    });
  }
}
