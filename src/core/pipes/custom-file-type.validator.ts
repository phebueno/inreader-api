import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class CustomFileTypeValidator implements PipeTransform {
  constructor(private allowedTypes: string[]) {}

  transform(file: Express.Multer.File) {
    if (!file) return file;

    const isValid = this.allowedTypes.includes(file.mimetype);
    if (!isValid) {
      throw new BadRequestException(
        `Only files of type ${this.allowedTypes.join(', ')} are allowed`,
      );
    }

    return file;
  }
}