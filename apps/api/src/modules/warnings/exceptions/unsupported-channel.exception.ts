import { BadRequestException } from '@nestjs/common';

// A selected alert channel has no registered AlertChannel implementation.
export class UnsupportedChannelException extends BadRequestException {
  constructor(channelTypes: readonly string[]) {
    super(`Unsupported alert channel(s): ${channelTypes.join(', ')}`);
  }
}
