import { describe, it, expect } from 'vitest';
import type { AlertChannelType } from '@rescue-lk/shared';
import { ChannelRegistry } from './channel.registry.js';
import type { AlertChannel } from './alert-channel.interface.js';
import { UnsupportedChannelException } from '../exceptions/unsupported-channel.exception.js';

const fakeChannel = (type: AlertChannelType): AlertChannel => ({
  type,
  send: () => Promise.resolve({ success: true }),
});

describe('ChannelRegistry', () => {
  const push = fakeChannel('push');
  const sms = fakeChannel('sms');
  const audible = fakeChannel('audible');

  it('resolves channels in the order they were requested', () => {
    const registry = new ChannelRegistry([push, sms, audible]);

    expect(registry.resolve(['audible', 'push'])).toEqual([audible, push]);
  });

  it('throws UnsupportedChannelException naming every missing channel', () => {
    const registry = new ChannelRegistry([push]);

    expect(() => registry.resolve(['push', 'sms', 'audible'])).toThrow(
      UnsupportedChannelException,
    );
    expect(() => registry.resolve(['push', 'sms', 'audible'])).toThrow(
      /sms.*audible/,
    );
  });

  it('refuses two implementations of the same channel type', () => {
    expect(() => new ChannelRegistry([push, fakeChannel('push')])).toThrow(
      /push/,
    );
  });
});
