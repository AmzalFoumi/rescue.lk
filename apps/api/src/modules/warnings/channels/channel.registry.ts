import { Inject, Injectable } from '@nestjs/common';
import type { AlertChannelType } from '@rescue-lk/shared';
import { ALERT_CHANNELS } from './alert-channel.interface.js';
import type { AlertChannel } from './alert-channel.interface.js';
import { UnsupportedChannelException } from '../exceptions/unsupported-channel.exception.js';

// Registry: maps the channel types an officer selected to their implementations,
// so callers never branch on channel type.
@Injectable()
export class ChannelRegistry {
  private readonly channels = new Map<AlertChannelType, AlertChannel>();

  constructor(@Inject(ALERT_CHANNELS) channels: readonly AlertChannel[]) {
    for (const channel of channels) {
      if (this.channels.has(channel.type)) {
        throw new Error(
          `Duplicate AlertChannel registered for type ${channel.type}`,
        );
      }
      this.channels.set(channel.type, channel);
    }
  }

  resolve(types: readonly AlertChannelType[]): AlertChannel[] {
    const resolved: AlertChannel[] = [];
    const unsupported: AlertChannelType[] = [];

    for (const type of types) {
      const channel = this.channels.get(type);
      if (channel) {
        resolved.push(channel);
      } else {
        unsupported.push(type);
      }
    }

    if (unsupported.length > 0) {
      throw new UnsupportedChannelException(unsupported);
    }
    return resolved;
  }
}
