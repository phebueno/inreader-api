import { AiCompletionEntity } from '@/ai-completions/entities/ai-completion.entity';
import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

export function CreateAiCompletionDoc() {
  return applyDecorators(
    ApiTags('AI Completions'),
    ApiBearerAuth(),
    ApiCreatedResponse({
      description: 'AI Completion criado com sucesso',
      type: AiCompletionEntity,
    }),
    ApiNotFoundResponse({
      description: 'Transcription não encontrada',
    }),
    ApiForbiddenResponse({
      description:
        'Você não possui permissão para criar AI Completion para esta transcription',
    }),
    ApiBadRequestResponse({
      description: 'ID inválido ou dados do prompt inválidos',
    }),
  );
}

export function GetAiCompletionsByTranscriptionDoc() {
  return applyDecorators(
    ApiTags('AI Completions'),
    ApiBearerAuth(),
    ApiOkResponse({
      description: 'Lista de AI Completions para uma transcription',
      type: [AiCompletionEntity],
    }),
    ApiNotFoundResponse({
      description: 'Transcription não encontrada',
    }),
    ApiForbiddenResponse({
      description:
        'Você não possui permissão para acessar essas AI Completions',
    }),
    ApiBadRequestResponse({
      description: 'ID da transcription inválido',
    }),
  );
}

export function GetAiCompletionDoc() {
  return applyDecorators(
    ApiTags('AI Completions'),
    ApiBearerAuth(),
    ApiOkResponse({
      description: 'AI Completion retornado com sucesso',
      type: AiCompletionEntity,
    }),
    ApiNotFoundResponse({
      description: 'AI Completion não encontrada',
    }),
    ApiForbiddenResponse({
      description: 'Você não possui permissão para acessar este AI Completion',
    }),
    ApiBadRequestResponse({
      description: 'ID inválido',
    }),
  );
}