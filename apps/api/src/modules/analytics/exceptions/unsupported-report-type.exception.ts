import { BadRequestException } from '@nestjs/common';

export class UnsupportedReportTypeException extends BadRequestException {
  constructor(type: string) {
    super(`Unsupported report type: ${type}`);
  }
}
