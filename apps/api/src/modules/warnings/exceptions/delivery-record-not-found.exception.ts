import { NotFoundException } from '@nestjs/common';

export class DeliveryRecordNotFoundException extends NotFoundException {
  constructor(recordId: string) {
    super(`Delivery record ${recordId} was not found`);
  }
}
