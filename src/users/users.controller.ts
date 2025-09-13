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
import {
  ApiTags,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { AuthGuard } from 'src/auth/guards/auth.guard';
import { AuthenticatedRequest } from 'src/auth/types/auth.types';
import { CreateUserDoc } from 'src/users/docs/create-user.docs';
import { GetUserDoc } from 'src/users/docs/get-user.doc';
import { UpdateUserDoc } from 'src/users/docs/update-user.doc';

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
  @ApiBearerAuth()
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
  @ApiBearerAuth()
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
