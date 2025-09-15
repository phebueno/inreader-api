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
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { UsersService } from '@/users/users.service';
import {
  GetUserDoc,
  UpdateUserDoc,
} from '@/users/docs/user.docs';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard)
  @Get(':id')
  @GetUserDoc()
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.sub !== id) {
      throw new ForbiddenException('You can only update your own user data');
    }
    return await this.usersService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  @UpdateUserDoc()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.sub !== id) {
      throw new ForbiddenException('You can only update your own user data');
    }
    return await this.usersService.update(id, updateUserDto);
  }
}
