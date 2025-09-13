import {
  Controller,
  Post,
  Param,
  Get,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';

import { AuthGuard } from '@/auth/guards/auth.guard';
import { TranscriptionsService } from '@/transcriptions/transcriptions.service';
import { AuthenticatedRequest } from '@/auth/types/auth.types';

@UseGuards(AuthGuard)
@Controller('transcriptions')
export class TranscriptionsController {
  constructor(private readonly transcriptionsService: TranscriptionsService) {}

  @Post('document/:documentId')
  async transcribe(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.transcriptionsService.transcribeDocument(
      req.user.sub,
      documentId,
    );
  }

  @Get('document/:documentId')
  async getTranscription(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.transcriptionsService.getByDocument(req.user.sub, documentId);
  }
}
