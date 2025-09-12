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
  providers: [AppService],
})
export class AppModule {}
