import { Controller, Post, Param, Get, UseGuards, Req } from '@nestjs/common';
import { TranscriptionsService } from './transcriptions.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('transcriptions')
export class TranscriptionsController {
  constructor(private readonly transcriptionsService: TranscriptionsService) {}

  @UseGuards(AuthGuard)
  @Post('document/:documentId')
  async transcribe(@Param('documentId') documentId: string, @Req() req) {
    return this.transcriptionsService.transcribeDocument(
      req.user.sub,
      documentId,
    );
  }

  @UseGuards(AuthGuard)
  @Get('document/:documentId')
  async getTranscription(@Param('documentId') documentId: string, @Req() req) {
    return this.transcriptionsService.getByDocument(req.user.sub, documentId);
  }
}
