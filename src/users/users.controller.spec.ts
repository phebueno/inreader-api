import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import {
  ForbiddenException,
  Injectable,
  CanActivate,
  ExecutionContext,
  PipeTransform,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@/auth/guards/auth.guard';

@Injectable()
class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}

class MockParseUUIDPipe implements PipeTransform {
  transform(value: any) {
    return value;
  }
}

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    })
      .overrideGuard(AuthGuard)
      .useClass(MockAuthGuard)
      .overridePipe(ParseUUIDPipe)
      .useClass(MockParseUUIDPipe)
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call usersService.create and return the result', async () => {
      const dto = { email: 'test@test.com', password: '123456', name: 'Fernando' };
      const mockResult = { id: '1', ...dto, createdAt: new Date() };
      mockUsersService.create.mockResolvedValue(mockResult);

      const result = await controller.create(dto);

      expect(result).toEqual(mockResult);
      expect(mockUsersService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findOne', () => {
    it('should return user when request user matches param', async () => {
      const mockUser = { id: '1', email: 'test@test.com', name: 'Fernando', createdAt: new Date() };
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const req = { user: { sub: '1' } } as any;

      const result = await controller.findOne('1', req);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findOne).toHaveBeenCalledWith('1');
    });

    it('should throw ForbiddenException if request user does not match param', async () => {
      const req = { user: { sub: '2' } } as any;

      await expect(controller.findOne('1', req)).rejects.toThrow(ForbiddenException);
      expect(mockUsersService.findOne).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should call usersService.update and return result when user matches', async () => {
      const dto = { name: 'Updated Name' };
      const mockUser = { id: '1', email: 'test@test.com', name: 'Updated Name', createdAt: new Date() };
      mockUsersService.update.mockResolvedValue(mockUser);

      const req = { user: { sub: '1' } } as any;

      const result = await controller.update('1', dto, req);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.update).toHaveBeenCalledWith('1', dto);
    });

    it('should throw ForbiddenException if request user does not match param', async () => {
      const dto = { name: 'Updated Name' };
      const req = { user: { sub: '2' } } as any;

      await expect(controller.update('1', dto, req)).rejects.toThrow(ForbiddenException);
      expect(mockUsersService.update).not.toHaveBeenCalled();
    });
  });
});