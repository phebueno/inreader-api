import { Module } from '@nestjs/common';
import { AiCompletionsService } from './ai-completions.service';
import { AiCompletionsController } from './ai-completions.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TranscriptionsModule } from 'src/transcriptions/transcriptions.module';

@Module({
  controllers: [AiCompletionsController],
  providers: [AiCompletionsService],
  imports: [PrismaModule, TranscriptionsModule],
})
export class AiCompletionsModule {}
