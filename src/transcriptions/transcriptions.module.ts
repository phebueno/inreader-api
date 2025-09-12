import { Module } from '@nestjs/common';
import { TranscriptionsService } from './transcriptions.service';
import { TranscriptionsController } from './transcriptions.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [TranscriptionsController],
  providers: [TranscriptionsService],
  imports: [PrismaModule],
})
export class TranscriptionsModule {}
