import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty({
    description: 'email by user',
  })
  email: string;

  @ApiProperty({
    description: 'password by user',
  })
  password: string;
}
