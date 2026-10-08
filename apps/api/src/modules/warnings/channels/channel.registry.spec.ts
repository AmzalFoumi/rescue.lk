import { describe, it, expect } from 'vitest';
import type { AlertChannelType } from '@rescue-lk/shared';
import { ChannelRegistry } from './channel.registry.js';
import type { AlertChannel } from './alert-channel.interface.js';
import { UnsupportedChannelException } from '../exceptions/unsupported-channel.exception.js';

const fakeChannel = (type: AlertChannelType): AlertChannel => ({
  type,
  send: () => Promise.resolve({ success: true, recipients: 1 }),
});

describe('ChannelRegistry', () => {
  const sms = fakeChannel('SMS');
  const push = fakeChannel('PUSH');
  const siren = fakeChannel('SIREN');

  it('resolves channels in the order they were requested', () => {
    const registry = new ChannelRegistry([sms, push, siren]);

    expect(registry.resolve(['SIREN', 'SMS'])).toEqual([siren, sms]);
  });

  it('throws UnsupportedChannelException naming every missing channel', () => {
    const registry = new ChannelRegistry([push]);

    expect(() => registry.resolve(['PUSH', 'SMS', 'SIREN'])).toThrow(
      UnsupportedChannelException,
    );
    expect(() => registry.resolve(['PUSH', 'SMS', 'SIREN'])).toThrow(
      /SMS.*SIREN/,
    );
  });

  it('refuses two implementations of the same channel type', () => {
    expect(() => new ChannelRegistry([push, fakeChannel('PUSH')])).toThrow(
      /PUSH/,
    );
  });
});
