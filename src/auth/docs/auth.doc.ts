import { LoginResponseDto } from '@/auth/dto/login-response.dto';
import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOkResponse,
  ApiBearerAuth,
  ApiBadRequestResponse,
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

export function ProfileDoc() {
  return applyDecorators(
    ApiTags('Auth'),
    ApiBearerAuth(),
    ApiOkResponse({
      description: 'Perfil do usuário autenticado',
    }),
  );
}
