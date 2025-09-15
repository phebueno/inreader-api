import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from '@/documents/documents.controller';
import { DocumentsService } from '@/documents/documents.service';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Response } from 'express';
import { PassThrough, Readable } from 'stream';

@Injectable()
class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let documentsService: DocumentsService;

  const mockDocumentsService = {
    createDocument: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getDocumentStream: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        { provide: DocumentsService, useValue: mockDocumentsService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useClass(MockAuthGuard)
      .compile();

    controller = module.get<DocumentsController>(DocumentsController);
    documentsService = module.get<DocumentsService>(DocumentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadDocument', () => {
    it('should call createDocument with userId and file', async () => {
      const mockFile = {
        originalname: 'test.png',
        buffer: Buffer.from(''),
      } as any;
      const mockUser = { sub: 'user-id' } as any;
      const mockResult = { id: 'doc-id', filename: 'test.png' };

      mockDocumentsService.createDocument.mockResolvedValue(mockResult);

      const result = await controller.uploadDocument(mockFile, {
        user: mockUser,
      } as any);

      expect(result).toEqual(mockResult);
      expect(mockDocumentsService.createDocument).toHaveBeenCalledWith(
        mockUser.sub,
        mockFile,
      );
    });
  });

  describe('findAll', () => {
    it('should call findAll with userId', async () => {
      const mockUser = { sub: 'user-id' } as any;
      const mockResult = [{ id: '1', filename: 'doc1.png' }];

      mockDocumentsService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll({ user: mockUser } as any);

      expect(result).toEqual(mockResult);
      expect(mockDocumentsService.findAll).toHaveBeenCalledWith(mockUser.sub);
    });
  });

  describe('findOne', () => {
    it('should call findOne with documentId and userId', async () => {
      const mockUser = { sub: 'user-id' } as any;
      const mockResult = { id: 'doc-id', filename: 'doc.png' };

      mockDocumentsService.findOne.mockResolvedValue(mockResult);

      const result = await controller.findOne('doc-id', {
        user: mockUser,
      } as any);

      expect(result).toEqual(mockResult);
      expect(mockDocumentsService.findOne).toHaveBeenCalledWith(
        'doc-id',
        mockUser.sub,
      );
    });
  });

  describe('download', () => {
    it('should set headers and call pipe', async () => {
      const mockUser = { sub: 'user-id' } as any;

      const mockStream = new PassThrough();
      const pipeSpy = jest
        .spyOn(mockStream, 'pipe')
        .mockImplementation(() => mockStream);

      const mockRes = {
        setHeader: jest.fn(),
      } as any as Response;

      mockDocumentsService.getDocumentStream.mockResolvedValue({
        stream: mockStream,
        mimeType: 'image/png',
        filename: 'doc.png',
      });

      await controller.download('doc-id', { user: mockUser } as any, mockRes);

      expect(mockDocumentsService.getDocumentStream).toHaveBeenCalledWith(
        'doc-id',
        mockUser.sub,
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'image/png',
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="doc.png"',
      );
      expect(pipeSpy).toHaveBeenCalledWith(mockRes);
    });
  });

  describe('remove', () => {
    it('should call remove with documentId and userId', async () => {
      const mockUser = { sub: 'user-id' } as any;
      const mockResult = { id: 'doc-id', filename: 'doc.png' };

      mockDocumentsService.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('doc-id', {
        user: mockUser,
      } as any);

      expect(result).toEqual(mockResult);
      expect(mockDocumentsService.remove).toHaveBeenCalledWith(
        'doc-id',
        mockUser.sub,
      );
    });
  });
});
