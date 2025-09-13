import { Module } from '@nestjs/common';

import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';

import { PrismaModule } from 'src/prisma/prisma.module';
import { TranscriptionsModule } from 'src/transcriptions/transcriptions.module';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService],
  imports: [PrismaModule, TranscriptionsModule],
})
export class DocumentsModule {}
