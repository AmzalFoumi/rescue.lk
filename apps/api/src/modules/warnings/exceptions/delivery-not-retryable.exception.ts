import { ConflictException } from '@nestjs/common';

export interface NotRetryableDelivery {
  recordId: string;
  // Why the manual retry was refused, e.g. "it is SENT".
  reason: string;
}

// DeliveryNotRetryableException (409): a manual retry is not allowed; the reason
// comes from retryRefusal.
// It extends a Nest HttpException, so the global AllExceptionsFilter sets the status
// and no controller needs try/catch.
export class DeliveryNotRetryableException extends ConflictException {
  constructor({ recordId, reason }: NotRetryableDelivery) {
    super(`Delivery ${recordId} cannot be retried: ${reason}`);
  }
}
