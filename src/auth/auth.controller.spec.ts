import { Test, TestingModule } from '@nestjs/testing';

import { AuthGuard } from '@/auth/guards/auth.guard';
import {
  CanActivate,
  ConflictException,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthController } from '@/auth/auth.controller';
import { AuthService } from '@/auth/auth.service';

@Injectable()
class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      .overrideGuard(AuthGuard)
      .useClass(MockAuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should call authService.login and return the result', async () => {
      const loginDto = { email: 'test@test.com', password: '123456' };
      const mockResult = {
        accessToken: 'mocked-jwt-token',
        username: 'Fernando',
      };
      mockAuthService.login.mockResolvedValue(mockResult);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockResult);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should throw UnauthorizedException if login fails', async () => {
      const loginDto = { email: 'wrong@test.com', password: '123456' };
      mockAuthService.login.mockRejectedValue(new UnauthorizedException());

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    it('should call authService.register and return the result', async () => {
      const registerDto = {
        email: 'new@test.com',
        password: '123456',
        name: 'Novo Usuário',
      };
      const mockResult = {
        id: '1',
        email: 'new@test.com',
        name: 'Novo Usuário',
        createdAt: new Date(),
      };

      mockAuthService.register.mockResolvedValue(mockResult);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockResult);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'existing@test.com',
        password: '123456',
        name: 'Usuário Existente',
      };

      mockAuthService.register.mockRejectedValue(new ConflictException());

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return the user from the request', () => {
      const mockUser = { id: '1', email: 'test@test.com', name: 'Fernando' };
      const req = { user: mockUser } as any;

      const result = controller.getProfile(req);

      expect(result).toEqual(mockUser);
    });
  });
});
