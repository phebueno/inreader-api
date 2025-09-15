import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';

import { LoginDto } from '@/auth/dto/login.dto';
import { LoginDoc, ProfileDoc, RegisterUserDoc } from '@/auth/docs/auth.doc';
import { AuthService } from '@/auth/auth.service';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { AuthenticatedRequest } from '@/auth/types/auth.types';
import { RegisterUserDto } from '@/auth/dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @LoginDoc()
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('register')
  @RegisterUserDoc()
  async register(@Body() loginDto: RegisterUserDto) {
    return await this.authService.register(loginDto);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  @ProfileDoc()
  getProfile(@Request() req: AuthenticatedRequest) {
    return req.user;
  }
}
