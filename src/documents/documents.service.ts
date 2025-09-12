import { Injectable } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { promises as fs } from "fs";
import { join } from 'path';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

async createDocument(userId: string, file: Express.Multer.File) {
  const filename = `${Date.now()}-${file.originalname}`;
  const localPath = join('uploads', filename);

  const doc = await this.prisma.document.create({
    data: {
      userId,
      key: localPath,
      mimeType: file.mimetype,
      status: 'PENDING',
    },
  });

  try {
    await this.prisma.document.update({
      where: { id: doc.id },
      data: {
        status: 'DONE',
        processedAt: new Date(),
      },
    });

    return { ...doc, status: 'DONE' };
  } catch (error) {
    await this.prisma.document.update({
      where: { id: doc.id },
      data: { status: 'FAILED' },
    });

    throw error;
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
