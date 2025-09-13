import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AiCompletionsService } from './ai-completions.service';

import { AuthGuard } from 'src/auth/guards/auth.guard';
import { AuthenticatedRequest } from 'src/auth/types/auth.types';

@Controller('ai-completions')
@UseGuards(AuthGuard)
export class AiCompletionsController {
  constructor(private readonly aiCompletionsService: AiCompletionsService) {}

  @Post('transcription/:transcriptionId')
  async create(
    @Param('transcriptionId') transcriptionId: string,
    @Body('prompt') prompt: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.aiCompletionsService.createAiCompletion(
      req.user.sub,
      transcriptionId,
      prompt,
    );
  }

  @Get('transcription/:transcriptionId')
  async findAllByTranscription(
    @Param('transcriptionId') transcriptionId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.aiCompletionsService.findAllByTranscription(
      req.user.sub,
      transcriptionId,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.aiCompletionsService.findOne(req.user.sub, id);
  }
}
