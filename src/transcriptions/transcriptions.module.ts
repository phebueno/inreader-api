import { Module } from '@nestjs/common';

import { TranscriptionsService } from './transcriptions.service';
import { TranscriptionsController } from './transcriptions.controller';

import { PrismaModule } from 'src/prisma/prisma.module';
import { TranscriptionsGateway } from 'src/transcriptions/transcriptions.gateway';

@Module({
  controllers: [TranscriptionsController],
  providers: [TranscriptionsService, TranscriptionsGateway],
  imports: [PrismaModule],
  exports: [TranscriptionsService, TranscriptionsGateway],
})
export class TranscriptionsModule {}
