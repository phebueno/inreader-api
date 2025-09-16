import { Injectable, NotFoundException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { PrismaService } from '@/prisma/prisma.service';
import { TranscriptionsService } from '@/transcriptions/transcriptions.service';
import { API_GEMINI_KEY } from '@/constants/constants';
import { CreateAiCompletionDto } from '@/ai-completions/dto/create-ai-completion.dto';

@Injectable()
export class AiCompletionsService {
  private genAI: GoogleGenerativeAI;

  constructor(
    private prisma: PrismaService,
    private transcriptionService: TranscriptionsService,
  ) {
    this.genAI = new GoogleGenerativeAI(API_GEMINI_KEY);
  }

  private buildMessages(prompt: string, transcriptionText: string) {
    const systemMessage = {
      role: 'user',
      parts: [
        {
          text: `Você é uma IA que analisa textos já extraídos de documentos ou imagens. 
          Você receberá perguntas sempre seguidas do texto extraído. Responda essas perguntas 
          de acordo ou obedeças as ordens do usuário de acordo. As requisições sempre virão no seguinte modelo:
          
          - Pergunta ou ordem do Usuário: [pergunta ou ordem]\n\n
          - Texto Extraído para Análise: [texto referência para suas análises]
          `,
        },
      ],
    };

    const userMessage = {
      role: 'user',
      parts: [
        {
          text: `- Pergunta ou ordem do Usuário: ${prompt}\n\n
          - Texto Extraído para Análise: ${transcriptionText}`,
        },
      ],
    };

    return [systemMessage, userMessage];
  }

  async createAiCompletion(
    userId: string,
    transcriptionId: string,
    { prompt }: CreateAiCompletionDto,
  ) {
    const transcription =
      await this.transcriptionService.getVerifiedTranscription(
        userId,
        transcriptionId,
      );

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const messages = this.buildMessages(prompt, transcription.text);

    const result = await model.generateContent({
      contents: messages,
    });
    const response = result.response;
    const completionText = response.text();

    const aiCompletion = await this.prisma.aiCompletion.create({
      data: {
        transcriptionId,
        prompt,
        response: completionText,
        tokensUsed: response.usageMetadata.totalTokenCount,
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
