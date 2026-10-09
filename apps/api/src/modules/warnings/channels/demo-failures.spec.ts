import { Logger } from '@nestjs/common';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import type { AlertChannel } from './alert-channel.interface.js';
import { parseChannelList, withDemoFailures } from './demo-failures.js';
import { FirstAttemptFailingChannel } from './first-attempt-failing.channel.js';

const fake = (type: AlertChannel['type']): AlertChannel => ({
  type,
  estimateRecipients: () => 1,
  send: () => Promise.resolve({ success: true, recipients: 1 }),
});

describe('demo failures', () => {
  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses a comma separated list of channel types', () => {
    expect(parseChannelList('SMS,SIREN')).toEqual(['SMS', 'SIREN']);
    expect(parseChannelList('')).toEqual([]);
    expect(parseChannelList(undefined)).toEqual([]);
  });

  it('wraps only the named channels, keeping their order', () => {
    const sms = fake('SMS');
    const push = fake('PUSH');

    const channels = withDemoFailures([sms, push], ['SMS']);

    expect(channels[0]).toBeInstanceOf(FirstAttemptFailingChannel);
    expect(channels[0].type).toBe('SMS');
    expect(channels[1]).toBe(push);
  });

  it('leaves every channel untouched when none are named', () => {
    const sms = fake('SMS');

    expect(withDemoFailures([sms], [])).toEqual([sms]);
  });
});
