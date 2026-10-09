import { BadRequestException } from '@nestjs/common';

export class UnsupportedExportFormatException extends BadRequestException {
  constructor(format: string) {
    super(`Unsupported export format: ${format}`);
  }
}
