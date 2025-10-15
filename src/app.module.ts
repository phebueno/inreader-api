import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';

import { AiCompletionsModule } from '@/ai-completions/ai-completions.module';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { AuthModule } from '@/auth/auth.module';
import { AllExceptionsFilter } from '@/core/all-exceptions.filter';
import { DocumentsModule } from '@/documents/documents.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { TranscriptionsModule } from '@/transcriptions/transcriptions.module';
import { UsersModule } from '@/users/users.module';
import { SupabaseModule } from './supabase/supabase.module';
import { ScheduleModule } from '@nestjs/schedule';
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DocumentsModule,
    TranscriptionsModule,
    AiCompletionsModule,
    SupabaseModule,
    ScheduleModule.forRoot()
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
