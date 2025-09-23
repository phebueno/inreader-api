import { Test, TestingModule } from '@nestjs/testing';

import { AuthenticatedRequest } from '@/auth/types/auth.types';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { TranscriptionsController } from '@/transcriptions/transcriptions.controller';
import { TranscriptionsService } from '@/transcriptions/transcriptions.service';

class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    return true;
  }
}

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

describe('TranscriptionsController', () => {
  let controller: TranscriptionsController;
  let service: jest.Mocked<TranscriptionsService>;

  const mockUser = { sub: 'user-id' } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TranscriptionsController],
      providers: [
        {
          provide: TranscriptionsService,
          useValue: {
            transcribeDocument: jest.fn(),
            getByDocument: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useClass(MockAuthGuard)
      .compile();

    controller = module.get<TranscriptionsController>(TranscriptionsController);
    service = module.get(
      TranscriptionsService,
    ) as jest.Mocked<TranscriptionsService>;
  });

  describe('transcribe', () => {
    it('should call transcribeDocument with user id and document id (success)', async () => {
      const mockResult = {
        id: 't1',
        documentId: 'd1',
        text: 'text',
        createdAt: new Date(),
      };
      service.transcribeDocument.mockResolvedValue(mockResult as any);

      const req = { user: mockUser } as AuthenticatedRequest;
      const response = await controller.transcribe('d1', req);

      expect(service.transcribeDocument).toHaveBeenCalledWith(
        mockUser.sub,
        'd1',
      );
      expect(response).toEqual(mockResult);
    });

    it('should throw NotFoundException if service throws NotFoundException', async () => {
      service.transcribeDocument.mockRejectedValue(
        new NotFoundException('Document not found'),
      );
      const req = { user: mockUser } as AuthenticatedRequest;

      await expect(controller.transcribe('d1', req)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if service throws ForbiddenException', async () => {
      service.transcribeDocument.mockRejectedValue(
        new ForbiddenException('Forbidden'),
      );
      const req = { user: mockUser } as AuthenticatedRequest;

      await expect(controller.transcribe('d1', req)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getTranscription', () => {
    it('should call getByDocument with user id and document id (success)', async () => {
      const mockResult = {
        id: 't1',
        documentId: 'd1',
        text: 'text',
        createdAt: new Date(),
      };
      service.getByDocument.mockResolvedValue(mockResult as any);

      const req = { user: mockUser } as AuthenticatedRequest;
      const response = await controller.getTranscription('d1', req);

      expect(service.getByDocument).toHaveBeenCalledWith(mockUser.sub, 'd1');
      expect(response).toEqual(mockResult);
    });

    it('should throw NotFoundException if service throws NotFoundException', async () => {
      service.getByDocument.mockRejectedValue(
        new NotFoundException('Transcription not found'),
      );
      const req = { user: mockUser } as AuthenticatedRequest;

      await expect(controller.getTranscription('d1', req)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if service throws ForbiddenException', async () => {
      service.getByDocument.mockRejectedValue(
        new ForbiddenException('Forbidden'),
      );
      const req = { user: mockUser } as AuthenticatedRequest;

      await expect(controller.getTranscription('d1', req)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
