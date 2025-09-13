import { TranscriptionDto } from '@/transcriptions/dto/transcription.dto';
import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

export function TranscribeDocumentDoc() {
  return applyDecorators(
    ApiTags('Transcriptions'),
    ApiBearerAuth(),
    ApiOkResponse({
      description: 'Transcrição do documento iniciada ou retornada com sucesso',
      type: TranscriptionDto,
    }),
    ApiNotFoundResponse({ description: 'Documento não encontrado' }),
    ApiBadRequestResponse({ description: 'ID de documento inválido' }),
  );
}

export function GetTranscriptionDoc() {
  return applyDecorators(
    ApiTags('Transcriptions'),
    ApiBearerAuth(),
    ApiOkResponse({
      description: 'Transcrição retornada com sucesso',
      type: TranscriptionDto,
    }),
    ApiNotFoundResponse({
      description: 'Documento ou transcrição não encontrados',
    }),
    ApiBadRequestResponse({ description: 'ID de documento inválido' }),
  );
}
