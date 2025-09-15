import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { PrismaService } from '@/prisma/prisma.service';
import { TranscriptionsService } from '@/transcriptions/transcriptions.service';
import { TranscriptionsGateway } from '@/transcriptions/transcriptions.gateway';
import { existsSync, createReadStream } from 'fs';
import { unlink } from 'fs/promises';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  createReadStream: jest.fn(),
}));
jest.mock('fs/promises', () => ({
  unlink: jest.fn(),
}));
jest.mock('tesseract.js', () => ({
  createWorker: jest.fn().mockImplementation(() => ({
    load: jest.fn(),
    loadLanguage: jest.fn(),
    initialize: jest.fn(),
    recognize: jest.fn().mockResolvedValue({ data: { text: 'mocked transcription' } }),
    terminate: jest.fn(),
  })),
}));

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prisma: {
    document: {
      create: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
  };
  let transcriptionsService: { transcribeDocument: jest.Mock };
  let gateway: { sendTranscriptionUpdate: jest.Mock };

  beforeEach(async () => {
    prisma = {
      document: {
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };

    transcriptionsService = {
      transcribeDocument: jest.fn(),
    };

    gateway = {
      sendTranscriptionUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: TranscriptionsService, useValue: transcriptionsService },
        { provide: TranscriptionsGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  describe('createDocument', () => {
    it('should create a document and process transcription successfully', async () => {
      const mockDoc = {
        id: '1',
        key: 'file.txt',
        userId: 'user',
        mimeType: 'text/plain',
      };

      prisma.document.create.mockResolvedValue(mockDoc);
      transcriptionsService.transcribeDocument.mockResolvedValue(
        'transcribed text',
      );
      prisma.document.update.mockResolvedValue({ ...mockDoc, status: 'DONE' });

      const result = await service.createDocument('user', {
        path: 'file.pdf',
        mimetype: 'application/pdf',
      } as any);

      expect(result).toEqual(mockDoc);

      await new Promise(setImmediate);

      expect(transcriptionsService.transcribeDocument).toHaveBeenCalledWith(
        'user',
        '1',
      );
      expect(prisma.document.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: 'DONE', processedAt: expect.any(Date) },
      });
      expect(gateway.sendTranscriptionUpdate).toHaveBeenCalledWith('user', {
        documentId: '1',
        status: 'DONE',
        transcription: 'transcribed text',
      });
    });

    it('should handle transcription failure and update status to FAILED', async () => {
      const mockDoc = {
        id: '2',
        key: 'file2.txt',
        userId: 'user',
        mimeType: 'text/plain',
      };

      prisma.document.create.mockResolvedValue({ ...mockDoc, id: '2' });
      transcriptionsService.transcribeDocument.mockRejectedValue(
        new Error('Transcription error'),
      );
      prisma.document.update.mockResolvedValue({
        ...mockDoc,
        status: 'FAILED',
      });

      const result = await service.createDocument('user', {
        path: 'file2.pdf',
        mimetype: 'application/pdf',
      } as any);

      expect(result).toEqual({ ...mockDoc, id: '2' });

      await new Promise(setImmediate);

      expect(prisma.document.update).toHaveBeenCalledWith({
        where: { id: '2' },
        data: { status: 'FAILED' },
      });

      expect(gateway.sendTranscriptionUpdate).toHaveBeenCalledWith('user', {
        documentId: '2',
        status: 'FAILED',
        error: 'Transcription error',
      });
    });
  });

  describe('findAll', () => {
    it('should return documents for a user', async () => {
      prisma.document.findMany.mockResolvedValue([{ id: '1' }] as any);
      const result = await service.findAll('user');
      expect(result).toEqual([{ id: '1' }]);
    });
  });

  describe('findOne', () => {
    it('should return a document if found and belongs to user', async () => {
      prisma.document.findUnique.mockResolvedValue({
        id: '1',
        userId: 'user',
      } as any);
      const result = await service.findOne('1', 'user');
      expect(result).toEqual({ id: '1', userId: 'user' });
    });

    it('should throw if document not found', async () => {
      prisma.document.findUnique.mockResolvedValue(null);
      await expect(service.findOne('1', 'user')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw if document belongs to another user', async () => {
      prisma.document.findUnique.mockResolvedValue({
        id: '1',
        userId: 'other',
      } as any);
      await expect(service.findOne('1', 'user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getDocumentStream', () => {
    it('should return a file stream if file exists', async () => {
      const mockDoc = {
        id: '1',
        key: 'file.txt',
        userId: 'user',
        mimeType: 'text/plain',
      };
      prisma.document.findUnique.mockResolvedValue(mockDoc as any);
      (existsSync as jest.Mock).mockReturnValue(true);
      (createReadStream as jest.Mock).mockReturnValue('stream' as any);

      const result = await service.getDocumentStream('1', 'user');
      expect(result).toEqual({
        stream: 'stream',
        mimeType: 'text/plain',
        filename: 'file.txt',
      });
    });

    it('should throw NotFoundException if file does not exist', async () => {
      const mockDoc = {
        id: '1',
        key: 'file.txt',
        userId: 'user',
        mimeType: 'text/plain',
      };
      prisma.document.findUnique.mockResolvedValue(mockDoc as any);
      (existsSync as jest.Mock).mockReturnValue(false);

      await expect(service.getDocumentStream('1', 'user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a document', async () => {
      prisma.document.findUnique.mockResolvedValue({
        id: '1',
        userId: 'user',
        key: 'file.txt',
      } as any);
      prisma.document.delete.mockResolvedValue({ id: '1' } as any);

      (existsSync as jest.Mock).mockReturnValue(true);
      (unlink as jest.Mock).mockResolvedValue(undefined);

      const result = await service.remove('1', 'user');
      expect(result).toEqual({ id: '1' });
      expect(prisma.document.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });
});
