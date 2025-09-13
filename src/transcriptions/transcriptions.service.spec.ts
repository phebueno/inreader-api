import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { TranscriptionsService } from '@/transcriptions/transcriptions.service';
import * as fs from 'fs';

jest.mock('tesseract.js', () => ({
  createWorker: jest.fn().mockImplementation(() => ({
    recognize: jest
      .fn()
      .mockResolvedValue({ data: { text: 'extracted text' } }),
    terminate: jest.fn(),
  })),
}));

describe('TranscriptionsService', () => {
  let service: TranscriptionsService;
  let prisma: {
    document: {
      findUnique: jest.Mock;
    };
    transcription: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      document: {
        findUnique: jest.fn(),
      },
      transcription: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranscriptionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TranscriptionsService>(TranscriptionsService);

    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getVerifiedTranscription', () => {
    it('should return transcription if user owns it', async () => {
      const mockTranscription = { id: '1', document: { userId: 'user' } };
      prisma.transcription.findUnique.mockResolvedValue(mockTranscription);

      const result = await service.getVerifiedTranscription('user', '1');
      expect(result).toEqual(mockTranscription);
    });

    it('should throw NotFoundException if transcription does not exist', async () => {
      prisma.transcription.findUnique.mockResolvedValue(null);
      await expect(
        service.getVerifiedTranscription('user', '1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own transcription', async () => {
      const mockTranscription = { id: '1', document: { userId: 'other' } };
      prisma.transcription.findUnique.mockResolvedValue(mockTranscription);

      await expect(
        service.getVerifiedTranscription('user', '1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('transcribeDocument', () => {
    it('should create transcription successfully', async () => {
      const mockDocument = {
        id: '1',
        key: 'file.png',
        userId: 'user',
        status: 'PENDING',
      };
      prisma.document.findUnique.mockResolvedValue(mockDocument);
      prisma.transcription.findUnique.mockResolvedValue(null);
      prisma.transcription.create.mockResolvedValue({
        id: 't1',
        text: 'extracted text',
      });

      const result = await service.transcribeDocument('user', '1');

      expect(result).toEqual({ id: 't1', text: 'extracted text' });
      expect(prisma.transcription.create).toHaveBeenCalledWith({
        data: { documentId: '1', text: 'extracted text' },
      });
    });

    it('should throw NotFoundException if document does not exist', async () => {
      prisma.document.findUnique.mockResolvedValue(null);
      await expect(service.transcribeDocument('user', '1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own document', async () => {
      prisma.document.findUnique.mockResolvedValue({
        id: '1',
        userId: 'other',
        status: 'PENDING',
      });
      await expect(service.transcribeDocument('user', '1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if transcription exists and document DONE', async () => {
      prisma.document.findUnique.mockResolvedValue({
        id: '1',
        userId: 'user',
        status: 'DONE',
      });
      prisma.transcription.findUnique.mockResolvedValue({ id: 't1' });
      await expect(service.transcribeDocument('user', '1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getByDocument', () => {
    it('should return transcription if user owns document', async () => {
      prisma.document.findUnique.mockResolvedValue({ id: '1', userId: 'user' });
      prisma.transcription.findUnique.mockResolvedValue({
        id: 't1',
        text: 'text',
      });

      const result = await service.getByDocument('user', '1');
      expect(result).toEqual({ id: 't1', text: 'text' });
    });

    it('should throw NotFoundException if document does not exist', async () => {
      prisma.document.findUnique.mockResolvedValue(null);
      await expect(service.getByDocument('user', '1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own document', async () => {
      prisma.document.findUnique.mockResolvedValue({
        id: '1',
        userId: 'other',
      });
      await expect(service.getByDocument('user', '1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
