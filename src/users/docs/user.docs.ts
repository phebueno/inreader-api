import { applyDecorators } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { UserEntity } from '@/users/entities/user.entity';

export function CreateUserDoc() {
  return applyDecorators(
    ApiCreatedResponse({
      type: UserEntity,
      description: 'Usuário criado com sucesso',
    }),
    ApiBadRequestResponse({
      description: 'Dados inválidos no corpo da requisição',
    }),
  );
}

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
