import { Module } from '@nestjs/common';

import { AiCompletionsController } from '@/ai-completions/ai-completions.controller';
import { AiCompletionsService } from '@/ai-completions/ai-completions.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { TranscriptionsModule } from '@/transcriptions/transcriptions.module';

@Module({
  controllers: [AiCompletionsController],
  providers: [AiCompletionsService],
  imports: [PrismaModule, TranscriptionsModule],
})
export class AiCompletionsModule {}
