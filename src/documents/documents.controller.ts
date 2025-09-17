import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Req,
  Res,
  ParseUUIDPipe,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { DocumentsService } from '@/documents/documents.service';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { AuthenticatedRequest } from '@/auth/types/auth.types';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import {
  DownloadDocumentDoc,
  GetAllDocumentsDoc,
  GetDocumentDoc,
  RemoveDocumentDoc,
  UploadDocumentDoc,
} from '@/documents/docs/documents.doc';
import { CustomFileTypeValidator } from '@/core/pipes/custom-file-type.validator';

@ApiTags('documents')
@Controller('documents')
@UseGuards(AuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  @UploadDocumentDoc()
  async uploadDocument(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
      }),
      new CustomFileTypeValidator([
        'image/bmp',
        'image/jpeg',
        'image/png',
        'image/x-portable-bitmap',
        'image/webp',
      ]),
    )
    file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.documentsService.createDocument(req.user.sub, file);
  }

  @Get()
  @GetAllDocumentsDoc()
  async findAll(@Req() req: AuthenticatedRequest) {
    return this.documentsService.findAll(req.user.sub);
  }

  @Get(':id')
  @GetDocumentDoc()
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.documentsService.findOne(id, req.user.sub);
  }

  @Get(':id/download')
  @DownloadDocumentDoc()
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const result = await this.documentsService.getDocumentStream(
      id,
      req.user.sub,
      { original: true },
    );

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );

    res.end(result.buffer);
  }

  @Get(':id/download/full')
  @DownloadDocumentDoc()
  async downloadFull(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const { buffer, mimeType, filename } =
      await this.documentsService.getDocumentStream(id, req.user.sub, {
        original: false,
      });

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Delete(':id')
  @RemoveDocumentDoc()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.documentsService.remove(id, req.user.sub);
  }
}
