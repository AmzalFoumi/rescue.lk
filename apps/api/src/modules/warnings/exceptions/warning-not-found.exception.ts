import { NotFoundException } from '@nestjs/common';

// Step 11 deliveryStatus was requested for a warning that does not exist.
export class WarningNotFoundException extends NotFoundException {
  constructor(warningId: string) {
    super(`Warning ${warningId} was not found`);
  }
}
