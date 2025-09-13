import { Test, TestingModule } from '@nestjs/testing';
import { AiCompletionsController } from './ai-completions.controller';
import { AiCompletionsService } from './ai-completions.service';
import { AuthenticatedRequest } from '@/auth/types/auth.types';
import { CreateAiCompletionDto } from './dto/create-ai-completion.dto';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { CanActivate } from '@nestjs/common';
import { AuthGuard } from '@/auth/guards/auth.guard';

@Injectable()
class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.user = { sub: 'user-id' };
    return true;
  }
}

describe('AiCompletionsController', () => {
  let controller: AiCompletionsController;
  let aiCompletionsService: {
    createAiCompletion: jest.Mock;
    findAllByTranscription: jest.Mock;
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    aiCompletionsService = {
      createAiCompletion: jest.fn(),
      findAllByTranscription: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiCompletionsController],
      providers: [
        { provide: AiCompletionsService, useValue: aiCompletionsService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useClass(MockAuthGuard)
      .compile();

    controller = module.get<AiCompletionsController>(AiCompletionsController);
  });

  const mockUser = {
    user: { sub: 'user-id', email: 'test@example.com' },
  } as AuthenticatedRequest;

  describe('create', () => {
    it('should call createAiCompletion with correct params', async () => {
      const transcriptionId = 'transcription-1';
      const dto: CreateAiCompletionDto = { prompt: 'Summarize this' };
      const mockResult = {
        id: 'ai1',
        transcriptionId,
        prompt: dto.prompt,
        response: 'AI summary',
      };

      aiCompletionsService.createAiCompletion.mockResolvedValue(mockResult);

      const result = await controller.create(transcriptionId, dto, mockUser);
      expect(aiCompletionsService.createAiCompletion).toHaveBeenCalledWith(
        mockUser.user.sub,
        transcriptionId,
        dto,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('findAllByTranscription', () => {
    it('should call findAllByTranscription with correct params', async () => {
      const transcriptionId = 'transcription-1';
      const mockResult = [{ id: 'ai1' }, { id: 'ai2' }];

      aiCompletionsService.findAllByTranscription.mockResolvedValue(mockResult);

      const result = await controller.findAllByTranscription(
        transcriptionId,
        mockUser,
      );
      expect(aiCompletionsService.findAllByTranscription).toHaveBeenCalledWith(
        mockUser.user.sub,
        transcriptionId,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should call findOne with correct params', async () => {
      const aiId = 'ai1';
      const mockResult = {
        id: aiId,
        transcriptionId: 'transcription-1',
        prompt: 'Prompt',
        response: 'Result',
      };

      aiCompletionsService.findOne.mockResolvedValue(mockResult);

      const result = await controller.findOne(aiId, mockUser);
      expect(aiCompletionsService.findOne).toHaveBeenCalledWith(
        mockUser.user.sub,
        aiId,
      );
      expect(result).toEqual(mockResult);
    });

    it('should throw NotFoundException if service throws', async () => {
      const aiId = 'nonexistent';
      aiCompletionsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(aiId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
