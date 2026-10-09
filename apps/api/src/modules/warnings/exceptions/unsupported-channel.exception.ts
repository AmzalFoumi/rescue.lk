import { BadRequestException } from '@nestjs/common';

// UnsupportedChannelException (400): a selected channel has no AlertChannel
// implementation registered. Thrown by ChannelRegistry before anything is saved or
// sent (fail fast). It extends BadRequestException, so the global filter sets the status.
export class UnsupportedChannelException extends BadRequestException {
  constructor(channelTypes: readonly string[]) {
    super(`Unsupported alert channel(s): ${channelTypes.join(', ')}`);
  }
}
