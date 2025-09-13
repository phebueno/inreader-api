import { applyDecorators } from '@nestjs/common';
import { ApiCreatedResponse, ApiBadRequestResponse } from '@nestjs/swagger';

import { UserEntity } from '../entities/user.entity';

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
