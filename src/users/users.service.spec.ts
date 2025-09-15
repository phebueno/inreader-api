import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from '@/users/users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return a user without password', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        name: 'Fernando',
        password: 'hashedPassword',
        createdAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('1');

      expect(result).toEqual({
        id: '1',
        email: 'test@test.com',
        name: 'Fernando',
        createdAt: mockUser.createdAt,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a user without changing password', async () => {
      const existingUser = {
        id: '1',
        email: 'test@test.com',
        name: 'Fernando',
        password: 'hashedPassword',
        createdAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.update.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        name: 'Updated Name',
        createdAt: new Date(),
      });

      const result = await service.update('1', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Updated Name' },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });
    });

    it('should hash password if provided', async () => {
      const existingUser = {
        id: '1',
        email: 'test@test.com',
        name: 'Fernando',
        password: 'oldHashedPassword',
        createdAt: new Date(),
      };
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('newHashedPassword');
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.update.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        name: 'Fernando',
        createdAt: new Date(),
      });

      await service.update('1', { password: 'newPassword' });

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ password: 'newHashedPassword' }),
        }),
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.update('999', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});