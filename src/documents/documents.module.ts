import { Module } from '@nestjs/common';

import { DocumentsController } from '@/documents/documents.controller';
import { DocumentsService } from '@/documents/documents.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { TranscriptionsModule } from '@/transcriptions/transcriptions.module';
import { SupabaseService } from '@/supabase/supabase.service';
import { SupabaseModule } from '@/supabase/supabase.module';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, SupabaseService],
  imports: [PrismaModule, TranscriptionsModule],
})
export class DocumentsModule {}
