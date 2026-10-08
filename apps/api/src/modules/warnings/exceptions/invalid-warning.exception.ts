import { BadRequestException } from '@nestjs/common';

// Sequence diagram alt [invalid] -> validationError: every failed rule from step 8.2.
export class InvalidWarningException extends BadRequestException {
  constructor(readonly reasons: readonly string[]) {
    super({ message: 'Warning failed validation', reasons });
  }
}
