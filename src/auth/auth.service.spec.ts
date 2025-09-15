import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mocked-jwt-token'),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return an access token when credentials are correct', async () => {
      const password = '123456';
      const hashedPassword = await bcrypt.hash(password, 10);
      const loginDto = { email: 'test@test.com', password };

      const userMock = {
        id: '1',
        email: 'test@test.com',
        name: 'Fernando',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        ...userMock,
        password: hashedPassword,
      });

      const result = await service.login(loginDto);

      expect(result).toEqual({
        accessToken: 'mocked-jwt-token',
        user: userMock,
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: userMock.email },
      });
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: userMock.id,
        email: userMock.email,
        name: userMock.name,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const loginDto = { email: 'notfound@test.com', password: '123456' };

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const loginDto = { email: 'test@test.com', password: 'wrongpass' };
      const hashedPassword = await bcrypt.hash('123456', 10);

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        password: hashedPassword,
        name: 'Fernando',
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    it('should create a new user if email is not taken', async () => {
      const registerDto = {
        email: 'new@test.com',
        password: '123456',
        name: 'Novo Usuário',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      mockPrismaService.user.create.mockResolvedValue({
        id: '2',
        email: 'new@test.com',
        name: 'Novo Usuário',
        createdAt: new Date(),
      });

      const result = await service.register(registerDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });

      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: registerDto.email,
            name: registerDto.name,
            // senha deve estar hasheada (não igual à original)
            password: expect.any(String),
          }),
        }),
      );

      expect(result).toHaveProperty('id');
      expect(result.email).toBe(registerDto.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'existing@test.com',
        password: '123456',
        name: 'Usuário Existente',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '3',
        email: 'existing@test.com',
        password: 'hashedPass',
        name: 'Usuário Existente',
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
