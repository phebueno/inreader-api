import { applyDecorators } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { UserEntity } from '../entities/user.entity';

export function UpdateUserDoc() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOkResponse({
      type: UserEntity,
      description: 'Usuário atualizado com sucesso',
    }),
    ApiForbiddenResponse({
      description: 'Tentativa de atualizar outro usuário',
    }),
    ApiNotFoundResponse({ description: 'Usuário não encontrado' }),
    ApiBadRequestResponse({
      description: 'ID inválido ou dados inválidos no corpo da requisição',
    }),
  );
}
