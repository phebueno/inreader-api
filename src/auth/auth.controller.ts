import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';

import { LoginDto } from '@/auth/dto/login.dto';
import { LoginDoc, ProfileDoc } from '@/auth/docs/auth.doc';
import { AuthService } from '@/auth/auth.service';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { AuthenticatedRequest } from '@/auth/types/auth.types';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @LoginDoc()
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  @ProfileDoc()
  getProfile(@Request() req: AuthenticatedRequest) {
    return req.user;
  }
}
