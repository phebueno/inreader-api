import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthGuard } from '@/auth/guards/auth.guard';
import { AuthenticatedRequest } from '@/auth/types/auth.types';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { UsersService } from '@/users/users.service';
import {
  CreateUserDoc,
  GetUserDoc,
  UpdateUserDoc,
} from '@/users/docs/user.docs';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @CreateUserDoc()
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  @GetUserDoc()
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.sub !== id) {
      throw new ForbiddenException('You can only update your own user data');
    }
    return this.usersService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  @UpdateUserDoc()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.sub !== id) {
      throw new ForbiddenException('You can only update your own user data');
    }
    return this.usersService.update(id, updateUserDto);
  }
}
