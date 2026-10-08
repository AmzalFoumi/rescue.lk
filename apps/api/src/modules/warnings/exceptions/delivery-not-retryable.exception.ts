import { ConflictException } from '@nestjs/common';

export interface NotRetryableDelivery {
  recordId: string;
  // Why the manual retry was refused, e.g. "it is SENT".
  reason: string;
}

// A manual retry is only allowed for a FAILED record of the current version
// of an ACTIVE warning.
export class DeliveryNotRetryableException extends ConflictException {
  constructor({ recordId, reason }: NotRetryableDelivery) {
    super(`Delivery ${recordId} cannot be retried: ${reason}`);
  }
}
