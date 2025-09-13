import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AiCompletionsService } from '@/ai-completions/ai-completions.service';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { AuthenticatedRequest } from '@/auth/types/auth.types';
import { CreateAiCompletionDto } from '@/ai-completions/dto/create-ai-completion.dto';

@UseGuards(AuthGuard)
@Controller('ai-completions')
export class AiCompletionsController {
  constructor(private readonly aiCompletionsService: AiCompletionsService) {}

  @Post('transcription/:transcriptionId')
  async create(
    @Param('transcriptionId', ParseUUIDPipe) transcriptionId: string,
    @Body() createAiCompletionDto: CreateAiCompletionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.aiCompletionsService.createAiCompletion(
      req.user.sub,
      transcriptionId,
      createAiCompletionDto,
    );
  }

  @Get('transcription/:transcriptionId')
  async findAllByTranscription(
    @Param('transcriptionId', ParseUUIDPipe) transcriptionId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.aiCompletionsService.findAllByTranscription(
      req.user.sub,
      transcriptionId,
    );
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.aiCompletionsService.findOne(req.user.sub, id);
  }
}
