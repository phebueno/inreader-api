import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '@/prisma/prisma.service';
import { LoginDto } from '@/auth/dto/login.dto';
import { RegisterUserDto } from '@/auth/dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login({ email, password }: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      username: user.name,
    };
  }

  async register({ email, password, name }: RegisterUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('E-mail already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  }
}
