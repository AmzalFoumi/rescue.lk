import { BadRequestException } from '@nestjs/common';
import type { WarningFormErrors } from '@rescue-lk/shared';

// Sequence diagram alt [invalid] -> validationError: one message per invalid
// field, so the UI can show each error next to its input.
export class InvalidWarningException extends BadRequestException {
  constructor(readonly errors: WarningFormErrors) {
    super({ message: 'Warning failed validation', errors });
  }
}
