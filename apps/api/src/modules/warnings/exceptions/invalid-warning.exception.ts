import { BadRequestException } from '@nestjs/common';
import type { WarningFormErrors } from '@rescue-lk/shared';

// InvalidWarningException (400): the warning breaks one or more business rules
// (sequence diagram alt [invalid] -> validationError).
// It carries one message per invalid field, so the UI shows each next to its input.
// It extends a Nest HttpException, so the global AllExceptionsFilter sets the status
// and no controller needs try/catch.
export class InvalidWarningException extends BadRequestException {
  constructor(readonly errors: WarningFormErrors) {
    super({ message: 'Warning failed validation', errors });
  }
}
