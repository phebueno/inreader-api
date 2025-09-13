import { randomUUID } from 'crypto';
import { extname } from 'path';

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import { DocumentsService } from '@/documents/documents.service';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { UpdateDocumentDto } from '@/documents/dto/update-document.dto';
import { AuthenticatedRequest } from '@/auth/types/auth.types';

@Controller('documents')
@UseGuards(AuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.documentsService.createDocument(req.user.sub, file);
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    return this.documentsService.findAll(req.user.sub);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.documentsService.findOne(id, req.user.sub);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.documentsService.remove(id, req.user.sub);
  }
}
