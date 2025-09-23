import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { PrismaService } from '@/prisma/prisma.service';
import { TranscriptionsService } from '@/transcriptions/transcriptions.service';
import { TranscriptionsGateway } from '@/transcriptions/transcriptions.gateway';
import { existsSync, createReadStream } from 'fs';
import { generatePdfFromImageAndTranscription } from '@/utils/pdf.utils';
import { unlink } from 'fs/promises';
import { SupabaseService } from '@/supabase/supabase.service';

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
    recognize: jest
      .fn()
      .mockResolvedValue({ data: { text: 'mocked transcription' } }),
    terminate: jest.fn(),
  })),
}));
jest.mock('@/utils/pdf.utils', () => ({
  generatePdfFromImageAndTranscription: jest
    .fn()
    .mockResolvedValue(Buffer.from('fake-pdf')),
}));
jest.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: jest.fn().mockReturnValue({
    promise: Promise.resolve({
      numPages: 1,
      getPage: jest.fn().mockResolvedValue({
        getTextContent: jest.fn().mockResolvedValue({ items: [] }),
      }),
    }),
  }),
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
  let supabaseMock: any;

  const fakeJpg = Buffer.from(
    'ffd8ffe000104a46494600010101006000600000ffdb00430008060607060508070707090a0c14' +
      '0d0c0b0b0c19120f141e1a1f1e1d1a1c1c20242730272d26201c1c282d2f2e2b2c2c30361f3830' +
      '32323631',
    'hex',
  );

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

    supabaseMock = {
      uploadFile: jest.fn().mockResolvedValue('fake-key'),
      downloadFile: jest.fn().mockResolvedValue(fakeJpg),
      deleteFile: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: SupabaseService, useValue: supabaseMock },
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
    it('should generate a PDF from image and transcription', async () => {
      const mockDoc = {
        id: '1',
        key: 'file.jpg',
        userId: 'user',
        mimeType: 'image/jpeg',
        transcription: { text: 'mocked transcription', aiCompletions: [] },
      };

      prisma.document.findUnique.mockResolvedValue(mockDoc as any);
      supabaseMock.downloadFile.mockResolvedValue(fakeJpg);

      const result = await service.getDocumentStream('1', 'user');

      expect(generatePdfFromImageAndTranscription).toHaveBeenCalledWith(
        fakeJpg,
        mockDoc,
      );

      expect(result).toEqual({
        buffer: Buffer.from('fake-pdf'),
        mimeType: 'application/pdf',
        filename: 'file.pdf',
      });
    });

    it('should return original buffer if options.original is true', async () => {
      jest.clearAllMocks();

      const mockDoc = {
        id: '1',
        key: 'file.jpg',
        userId: 'user',
        mimeType: 'image/jpeg',
        transcription: { text: 'mocked transcription', aiCompletions: [] },
      };

      prisma.document.findUnique.mockResolvedValue(mockDoc as any);
      supabaseMock.downloadFile.mockResolvedValue(fakeJpg);

      const result = await service.getDocumentStream('1', 'user', {
        original: true,
      });

      expect(result).toEqual({
        buffer: fakeJpg,
        mimeType: 'image/jpeg',
        filename: 'file.jpg',
      });

      expect(generatePdfFromImageAndTranscription).not.toHaveBeenCalled();
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
