import { Test, TestingModule } from '@nestjs/testing';
import { AiCompletionsController } from './ai-completions.controller';
import { AiCompletionsService } from './ai-completions.service';

describe('AiCompletionsController', () => {
  let controller: AiCompletionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiCompletionsController],
      providers: [AiCompletionsService],
    }).compile();

    controller = module.get<AiCompletionsController>(AiCompletionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
