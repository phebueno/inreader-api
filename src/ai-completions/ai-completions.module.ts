import { Module } from '@nestjs/common';
import { AiCompletionsService } from './ai-completions.service';
import { AiCompletionsController } from './ai-completions.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [AiCompletionsController],
  providers: [AiCompletionsService],
  imports: [PrismaModule],
})
export class AiCompletionsModule {}
