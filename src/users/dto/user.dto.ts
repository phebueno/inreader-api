import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID do usuário' })
  id: string;

  @ApiProperty({ example: 'email@email.com', description: 'Email do usuário' })
  email: string;

  @ApiProperty({ example: 'pheru', description: 'Nome do usuário' })
  name: string;
}