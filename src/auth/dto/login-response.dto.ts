import { UserDto } from '@/users/dto/user.dto';
import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token JWT de autenticação',
  })
  accessToken: string;

  @ApiProperty({ type: UserDto })
  user: UserDto;
}
