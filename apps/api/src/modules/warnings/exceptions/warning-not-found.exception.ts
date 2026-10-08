import { NotFoundException } from '@nestjs/common';

// WarningNotFoundException (404): the warning does not exist.
// Thrown from one place (requireWarning). It extends NotFoundException, so the global
// AllExceptionsFilter sets the status.
export class WarningNotFoundException extends NotFoundException {
  constructor(warningId: string) {
    super(`Warning ${warningId} was not found`);
  }
}
