import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_GEMINI_KEY } from 'src/constants/constants';
import { TranscriptionsService } from 'src/transcriptions/transcriptions.service';

@Injectable()
export class AiCompletionsService {
  private genAI: GoogleGenerativeAI;

  constructor(
    private prisma: PrismaService,
    private transcriptionService: TranscriptionsService,
  ) {
    this.genAI = new GoogleGenerativeAI(API_GEMINI_KEY);
  }

  async createAiCompletion(
    userId: string,
    transcriptionId: string,
    prompt: string,
  ) {
    const transcription =
      await this.transcriptionService.getVerifiedTranscription(
        userId,
        transcriptionId,
      );

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(
      `${prompt}\n\n${transcription.text}`,
    );
    const response = result.response;
    const completionText = response.text();

    const aiCompletion = await this.prisma.aiCompletion.create({
      data: {
        transcriptionId,
        prompt,
        response: completionText,
      },
    });

    return aiCompletion;
  }

  async findAllByTranscription(userId: string, transcriptionId: string) {
    await this.transcriptionService.getVerifiedTranscription(
      userId,
      transcriptionId,
    );

    return this.prisma.aiCompletion.findMany({
      where: { transcriptionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const aiCompletion = await this.prisma.aiCompletion.findUnique({
      where: { id },
    });
    if (!aiCompletion) throw new NotFoundException('AiCompletion not found');

    await this.transcriptionService.getVerifiedTranscription(
      userId,
      aiCompletion.transcriptionId,
    );

    return aiCompletion;
  }
}
