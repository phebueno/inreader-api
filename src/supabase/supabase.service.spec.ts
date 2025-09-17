import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from './supabase.service';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { extname } from 'path';

jest.mock('@supabase/supabase-js');
jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'mocked-uuid'),
}));

describe('SupabaseService', () => {
  let service: SupabaseService;
  let mockSupabase: any;
  const bucketName = 'test-bucket';

  beforeEach(async () => {
    mockSupabase = {
      storage: {
        createBucket: jest.fn(),
        from: jest.fn().mockReturnThis(),
        upload: jest.fn(),
        remove: jest.fn(),
        download: jest.fn(),
      },
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    const module: TestingModule = await Test.createTestingModule({
      providers: [SupabaseService],
    }).compile();

    service = module.get<SupabaseService>(SupabaseService);

    // sobrescrever bucket para testes
    (service as any).bucket = bucketName;
    (service as any).logger = {
      log: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should call ensureBucketExists once', async () => {
      const ensureSpy = jest
        .spyOn(service, 'ensureBucketExists')
        .mockResolvedValue(undefined);
      await service.onModuleInit();
      expect(ensureSpy).toHaveBeenCalled();
    });
  });

  describe('ensureBucketExists', () => {
    it('should log success if bucket created', async () => {
      mockSupabase.storage.createBucket.mockResolvedValue({ error: null });
      await service.ensureBucketExists();
      expect((service as any).logger.log).toHaveBeenCalledWith(
        `Bucket "${bucketName}" created successfully!`,
      );
    });

    it('should log if bucket already exists', async () => {
      mockSupabase.storage.createBucket.mockResolvedValue({
        error: { message: 'Bucket already exists' },
      });
      await service.ensureBucketExists();
      expect((service as any).logger.log).toHaveBeenCalledWith(
        `Bucket "${bucketName}" already exists. Continuing normally.`,
      );
    });

    it('should exit process on other errors', async () => {
      mockSupabase.storage.createBucket.mockResolvedValue({
        error: { message: 'Some other error' },
      });
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((
        code?: number,
      ) => {
        throw new Error('process.exit called');
      }) as any);

      await expect(service.ensureBucketExists()).rejects.toThrow(
        'process.exit called',
      );
      expect((service as any).logger.error).toHaveBeenCalledWith(
        'Error creating bucket: Some other error',
      );
      exitSpy.mockRestore();
    });
  });

  describe('uploadFile', () => {
    const file = {
      originalname: 'file.txt',
      buffer: Buffer.from('test'),
      mimetype: 'text/plain',
    } as Express.Multer.File;

    it('should upload file and return key', async () => {
      mockSupabase.storage.upload.mockResolvedValue({ error: null });
      const key = await service.uploadFile(file);
      expect(key).toBe('mocked-uuid.txt');
    });

    it('should throw InternalServerErrorException on upload error', async () => {
      mockSupabase.storage.upload.mockResolvedValue({
        error: { message: 'fail' },
      });
      await expect(service.uploadFile(file)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      mockSupabase.storage.remove.mockResolvedValue({ error: null });
      await service.deleteFile('some-key');
      expect((service as any).logger.log).toHaveBeenCalledWith(
        'File "some-key" deleted successfully from bucket.',
      );
    });

    it('should throw InternalServerErrorException on delete error', async () => {
      mockSupabase.storage.remove.mockResolvedValue({
        error: { message: 'fail' },
      });
      await expect(service.deleteFile('some-key')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('downloadFile', () => {
    it('should download and return buffer', async () => {
      const mockArrayBuffer = async () =>
        new Uint8Array([116, 101, 115, 116]).buffer; // bytes de 'test'

      // mock completo do chain do Supabase
      mockSupabase.storage.from = jest.fn().mockReturnValue({
        download: jest.fn().mockResolvedValue({
          data: { arrayBuffer: mockArrayBuffer },
          error: null,
        }),
      });

      const result = await service.downloadFile('some-key');
      expect(result.toString()).toBe('test'); // agora deve passar
    });

    it('should throw InternalServerErrorException on download error', async () => {
      mockSupabase.storage.from = jest.fn().mockReturnValue({
        download: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'fail' },
        }),
      });

      await expect(service.downloadFile('some-key')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
