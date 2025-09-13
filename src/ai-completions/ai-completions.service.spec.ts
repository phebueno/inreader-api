import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { TranscriptionsService } from '@/transcriptions/transcriptions.service';
import { NotFoundException } from '@nestjs/common';
import { AiCompletionsService } from '@/ai-completions/ai-completions.service';
import { CreateAiCompletionDto } from '@/ai-completions/dto/create-ai-completion.dto';

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
  let prisma: { aiCompletion: any };
  let transcriptionService: { getVerifiedTranscription: jest.Mock };

  const mockUser = 'user-id';
  const mockTranscription = {
    id: 't1',
    text: 'transcription text',
    document: { userId: mockUser },
  };

  beforeEach(async () => {
    prisma = {
      aiCompletion: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    transcriptionService = {
      getVerifiedTranscription: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiCompletionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: TranscriptionsService, useValue: transcriptionService },
      ],
    }).compile();

    service = module.get<AiCompletionsService>(AiCompletionsService);

    mockGenerateContent.mockReset();
    mockText.mockReset();
  });

  describe('createAiCompletion', () => {
    it('should create AI completion successfully', async () => {
      transcriptionService.getVerifiedTranscription.mockResolvedValue(
        mockTranscription,
      );

      const promptDto: CreateAiCompletionDto = { prompt: 'Summarize this' };
      const aiResponseText = 'AI generated summary';
      mockText.mockReturnValue(aiResponseText);
      mockGenerateContent.mockResolvedValue({ response: { text: mockText } });

      prisma.aiCompletion.create.mockResolvedValue({
        id: 'ai1',
        transcriptionId: 't1',
        prompt: promptDto.prompt,
        response: aiResponseText,
      });

      const result = await service.createAiCompletion(
        mockUser,
        't1',
        promptDto,
      );

      expect(
        transcriptionService.getVerifiedTranscription,
      ).toHaveBeenCalledWith(mockUser, 't1');
      expect(mockGenerateContent).toHaveBeenCalledWith(
        `${promptDto.prompt}\n\n${mockTranscription.text}`,
      );
      expect(prisma.aiCompletion.create).toHaveBeenCalledWith({
        data: {
          transcriptionId: 't1',
          prompt: promptDto.prompt,
          response: aiResponseText,
        },
      });
      expect(result).toEqual({
        id: 'ai1',
        transcriptionId: 't1',
        prompt: promptDto.prompt,
        response: aiResponseText,
      });
    });
  });

  describe('findAllByTranscription', () => {
    it('should return all AI completions for a transcription', async () => {
      transcriptionService.getVerifiedTranscription.mockResolvedValue(
        mockTranscription,
      );
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

      transcriptionService.getVerifiedTranscription.mockResolvedValue(
        mockTranscription,
      );

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
});
