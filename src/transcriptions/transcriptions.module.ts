import { Module } from '@nestjs/common';

import { TranscriptionsService } from './transcriptions.service';
import { TranscriptionsController } from './transcriptions.controller';

import { PrismaModule } from 'src/prisma/prisma.module';
import { TranscriptionsGateway } from 'src/transcriptions/transcriptions.gateway';
import { SupabaseModule } from '@/supabase/supabase.module';
import { SupabaseService } from '@/supabase/supabase.service';

@Module({
  controllers: [TranscriptionsController],
  providers: [TranscriptionsService, TranscriptionsGateway, SupabaseService],
  imports: [PrismaModule, SupabaseModule],
  exports: [TranscriptionsService, TranscriptionsGateway],
})
export class TranscriptionsModule {}
