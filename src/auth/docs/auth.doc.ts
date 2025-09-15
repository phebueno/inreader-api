import { LoginResponseDto } from '@/auth/dto/login-response.dto';
import { UserEntity } from '@/users/entities/user.entity';
import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOkResponse,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

export function LoginDoc() {
  return applyDecorators(
    ApiTags('Auth'),
    ApiOkResponse({
      type: LoginResponseDto,
      description: 'Login realizado com sucesso',
    }),
    ApiBadRequestResponse({
      description: 'Email ou senha inválidos',
    }),
  );
}

export function RegisterUserDoc() {
  return applyDecorators(
    ApiCreatedResponse({
      type: UserEntity,
      description: 'Usuário criado com sucesso',
    }),
    ApiConflictResponse({
      description: 'E-mail já em uso',
    }),
    ApiBadRequestResponse({
      description: 'Dados inválidos no corpo da requisição',
    }),
  );
}

export function ProfileDoc() {
  return applyDecorators(
    ApiTags('Auth'),
    ApiBearerAuth(),
    ApiOkResponse({
      description: 'Perfil do usuário autenticado',
    }),
  );
}
