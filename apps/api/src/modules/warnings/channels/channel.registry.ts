import { Inject, Injectable } from '@nestjs/common';
import type { AlertChannelType } from '@rescue-lk/shared';
import { ALERT_CHANNELS } from './alert-channel.interface.js';
import type { AlertChannel } from './alert-channel.interface.js';
import { UnsupportedChannelException } from '../exceptions/unsupported-channel.exception.js';

// ChannelRegistry turns the channel types an officer picked (e.g. ['SMS', 'SIREN'])
// into the AlertChannel objects that send them.
// Registry pattern: one lookup table, so no caller writes an if/switch on channel type
// and adding a channel never edits those callers (OCP).
// DIP: it receives the channels through the ALERT_CHANNELS token instead of creating
// them, so tests can register fake channels.
// It fails fast on a duplicate or unknown channel instead of silently skipping it.
@Injectable()
export class ChannelRegistry {
  private readonly channels = new Map<AlertChannelType, AlertChannel>();

  // Fail fast at startup: two channels for one type would make the choice ambiguous.
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

  // Every registered channel, in registration order.
  all(): AlertChannel[] {
    return [...this.channels.values()];
  }

  // Fail fast: an unknown type throws UnsupportedChannelException before anything is
  // saved or sent, instead of silently skipping that channel.
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
