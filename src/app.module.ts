import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from 'src/constants/constants';
import { DocumentsModule } from './documents/documents.module';
import { TranscriptionsModule } from './transcriptions/transcriptions.module';
import { AiCompletionsModule } from './ai-completions/ai-completions.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from 'src/core/all-exceptions.filter';

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
