import { applyDecorators } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { UserEntity } from '../entities/user.entity';

export function GetUserDoc() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOkResponse({
      type: UserEntity,
      description: 'Usuário retornado com sucesso',
    }),
    ApiForbiddenResponse({
      description: 'Tentativa de acessar dados de outro usuário',
    }),
    ApiNotFoundResponse({ description: 'Usuário não encontrado' }),
    ApiBadRequestResponse({ description: 'ID inválido (não é um UUID)' }),
  );
}
