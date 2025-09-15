import * as bcrypt from 'bcrypt';
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';
import { UpdateUserDto } from '@/users/dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private async getUserOrFail(id: string) {
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
  }

  async findOne(id: string) {
    const user = await this.getUserOrFail(id);
    const { password: _, ...result } = user;
    return result;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.getUserOrFail(id);

    const data: Partial<UpdateUserDto> = { ...updateUserDto };

    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id: id.toString() },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  }
}
