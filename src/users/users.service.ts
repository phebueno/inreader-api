import * as bcrypt from 'bcrypt';
import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create({ email, password, name }: CreateUserDto) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      return await this.prisma.user.create({
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
    } catch (error) {
      throw new InternalServerErrorException('Failed to create user', error.message);
    }
  }

  private async getUserOrFail(id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          password: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to fetch user', error.message);
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.getUserOrFail(id);
      const { password, ...result } = user;
      return result;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      await this.getUserOrFail(id);

      const data: Partial<UpdateUserDto> = { ...updateUserDto };

      if (updateUserDto.password) {
        data.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      return await this.prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to update user', error.message);
    }
  }
}