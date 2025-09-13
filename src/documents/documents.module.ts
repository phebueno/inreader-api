import { Module } from '@nestjs/common';

import { DocumentsController } from '@/documents/documents.controller';
import { DocumentsService } from '@/documents/documents.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { TranscriptionsModule } from '@/transcriptions/transcriptions.module';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService],
  imports: [PrismaModule, TranscriptionsModule],
})
export class DocumentsModule {}
