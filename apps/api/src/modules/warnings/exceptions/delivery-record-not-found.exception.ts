import { NotFoundException } from '@nestjs/common';

// DeliveryRecordNotFoundException (404): the delivery record to retry does not exist.
// It extends NotFoundException, so the global AllExceptionsFilter sets the status.
export class DeliveryRecordNotFoundException extends NotFoundException {
  constructor(recordId: string) {
    super(`Delivery record ${recordId} was not found`);
  }
}
