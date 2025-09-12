import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { authConfig } from 'src/config/auth.config';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtService],
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: authConfig.jwt.secret,
      signOptions: { expiresIn: authConfig.jwt.expiresIn },
    }),
  ],
})
export class AuthModule {}
