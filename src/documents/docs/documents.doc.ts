import { applyDecorators } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { DocumentEntity } from '@/documents/entities/document.entity';

export function UploadDocumentDoc() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Arquivo a ser enviado',
      schema: {
        type: 'object',
        properties: {
          file: { type: 'string', format: 'binary' },
        },
        required: ['file'],
      },
    }),
    ApiCreatedResponse({
      type: DocumentEntity,
      description: 'Documento enviado com sucesso',
    }),
    ApiBadRequestResponse({
      description: 'Falha na validação do arquivo (tipo ou tamanho inválido)',
    }),
  );
}

export function GetAllDocumentsDoc() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOkResponse({
      type: [DocumentEntity],
      description: 'Lista de documentos do usuário autenticado',
    }),
  );
}

export function GetDocumentDoc() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOkResponse({
      type: DocumentEntity,
      description: 'Documento retornado com sucesso',
    }),
    ApiNotFoundResponse({
      description: 'Documento não encontrado',
    }),
    ApiBadRequestResponse({
      description: 'ID inválido (não é um UUID)',
    }),
  );
}

export function DownloadDocumentDoc() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOkResponse({
      description: 'Arquivo enviado para download com sucesso',
    }),
    ApiNotFoundResponse({
      description: 'Documento não encontrado',
    }),
    ApiBadRequestResponse({
      description: 'ID inválido (não é um UUID)',
    }),
  );
}

export function RemoveDocumentDoc() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOkResponse({
      description: 'Documento removido com sucesso',
    }),
    ApiNotFoundResponse({
      description: 'Documento não encontrado',
    }),
    ApiBadRequestResponse({
      description: 'ID inválido (não é um UUID)',
    }),
  );
}