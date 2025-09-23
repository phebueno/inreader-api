import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { TranscriptionsService } from '@/transcriptions/transcriptions.service';
import { NotFoundException } from '@nestjs/common';
import { AiCompletionsService } from '@/ai-completions/ai-completions.service';
import { CreateAiCompletionDto } from '@/ai-completions/dto/create-ai-completion.dto';
import { SupabaseService } from '@/supabase/supabase.service';

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

const mockGenerateContent = jest.fn();
const mockText = jest.fn();

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}));

describe('AiCompletionsService', () => {
  let service: AiCompletionsService;
  let prisma: any;
  let transcriptionService: any;
  let supabaseService: { downloadFile: jest.Mock };

  const mockUser = 'user-id';
  const mockTranscription = {
    id: 't1',
    text: 'transcription text',
    document: { userId: mockUser },
  };
  const aiResponseText = 'AI generated summary';
  const totalTokens = 42;

  beforeEach(async () => {
    prisma = {
      aiCompletion: {
        create: jest.fn().mockResolvedValue({
          id: 'ai1',
          transcriptionId: 't1',
          prompt: 'Summarize this',
          response: aiResponseText,
          tokensUsed: totalTokens,
        }),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    transcriptionService = {
      getVerifiedTranscription: jest.fn().mockResolvedValue(mockTranscription),
    };

    supabaseService = {
      downloadFile: jest.fn().mockResolvedValue(Buffer.from('fake-image')),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiCompletionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: TranscriptionsService, useValue: transcriptionService },
        { provide: SupabaseService, useValue: supabaseService },
        {
          provide: SupabaseService,
          useValue: { upload: jest.fn(), delete: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AiCompletionsService>(AiCompletionsService);

    mockText.mockReturnValue(aiResponseText);
    mockGenerateContent.mockResolvedValue({
      response: {
        text: mockText,
        usageMetadata: { totalTokenCount: totalTokens },
      },
    });
  });

  describe('createAiCompletion', () => {
    it('should create AI completion successfully', async () => {
      const promptDto: CreateAiCompletionDto = { prompt: 'Summarize this' };

      const result = await service.createAiCompletion(
        mockUser,
        't1',
        promptDto,
      );

      expect(
        transcriptionService.getVerifiedTranscription,
      ).toHaveBeenCalledWith(mockUser, 't1');
      expect(mockGenerateContent).toHaveBeenCalledWith({
        contents: expect.any(Array),
      });
      expect(prisma.aiCompletion.create).toHaveBeenCalledWith({
        data: {
          transcriptionId: 't1',
          prompt: promptDto.prompt,
          response: aiResponseText,
          tokensUsed: totalTokens,
        },
      });
      expect(result).toEqual({
        id: 'ai1',
        transcriptionId: 't1',
        prompt: promptDto.prompt,
        response: aiResponseText,
        tokensUsed: totalTokens,
      });
    });
  });

  describe('findAllByTranscription', () => {
    it('should return all AI completions for a transcription', async () => {
      const mockCompletions = [{ id: 'ai1' }, { id: 'ai2' }];
      prisma.aiCompletion.findMany.mockResolvedValue(mockCompletions);

      const result = await service.findAllByTranscription(mockUser, 't1');

      expect(
        transcriptionService.getVerifiedTranscription,
      ).toHaveBeenCalledWith(mockUser, 't1');
      expect(prisma.aiCompletion.findMany).toHaveBeenCalledWith({
        where: { transcriptionId: 't1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockCompletions);
    });
  });

  describe('findOne', () => {
    it('should return AI completion by id', async () => {
      prisma.aiCompletion.findUnique.mockResolvedValue({
        id: 'ai1',
        transcriptionId: 't1',
        prompt: 'Prompt',
        response: 'Result',
      });

      const result = await service.findOne(mockUser, 'ai1');

      expect(prisma.aiCompletion.findUnique).toHaveBeenCalledWith({
        where: { id: 'ai1' },
      });
      expect(
        transcriptionService.getVerifiedTranscription,
      ).toHaveBeenCalledWith(mockUser, 't1');
      expect(result).toEqual({
        id: 'ai1',
        transcriptionId: 't1',
        prompt: 'Prompt',
        response: 'Result',
      });
    });

    it('should throw NotFoundException if AI completion not found', async () => {
      prisma.aiCompletion.findUnique.mockResolvedValue(null);
      await expect(service.findOne(mockUser, 'ai1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('buildMessages', () => {
    it('should pass correctly built messages to generateContent', async () => {
      const promptDto = { prompt: 'Pergunta teste' };

      await service.createAiCompletion(mockUser, 't1', promptDto);

      expect(mockGenerateContent).toHaveBeenCalledWith({
        contents: [
          expect.objectContaining({
            role: 'user',
            parts: [
              {
                text: expect.stringContaining(
                  'Você é uma IA que analisa textos já extraídos',
                ),
              },
            ],
          }),
          expect.objectContaining({
            role: 'user',
            parts: [
              {
                text: expect.stringContaining('Pergunta teste'),
              },
            ],
          }),
        ],
      });
    });
  });
});