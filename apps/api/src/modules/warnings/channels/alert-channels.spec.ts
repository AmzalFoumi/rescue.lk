import { Logger } from '@nestjs/common';
import { describe, afterEach, it, expect, vi } from 'vitest';
import type { AlertChannel } from './alert-channel.interface.js';
import { PushChannel } from './push.channel.js';
import { SmsChannel } from './sms.channel.js';
import { SirenChannel } from './siren.channel.js';
import { buildWarningRecord } from '../testing/warning.fixtures.js';

const warning = buildWarningRecord({ channels: ['SMS', 'PUSH', 'SIREN'] });
const TWO_DISTRICTS = ['Ratnapura', 'Kalutara'];

describe.each<[AlertChannel['type'], () => AlertChannel]>([
  ['SMS', () => new SmsChannel()],
  ['PUSH', () => new PushChannel()],
  ['SIREN', () => new SirenChannel()],
])('%s alert channel (mock gateway)', (type, createChannel) => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it(`declares its type as ${type}`, () => {
    expect(createChannel().type).toBe(type);
  });

  it('sends successfully and logs the warning id', async () => {
    const logSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);

    const result = await createChannel().send({
      warning,
      districts: TWO_DISTRICTS,
    });

    expect(result.success).toBe(true);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(warning.id));
  });

  it('reaches more recipients when more districts are targeted', async () => {
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const channel = createChannel();

    const one = await channel.send({ warning, districts: ['Ratnapura'] });
    const two = await channel.send({ warning, districts: TWO_DISTRICTS });

    expect(one).toMatchObject({ success: true });
    expect(two).toMatchObject({ success: true });
    if (one.success && two.success) {
      expect(one.recipients).toBeGreaterThan(0);
      expect(two.recipients).toBe(one.recipients * TWO_DISTRICTS.length);
    }
  });

  it('estimates the same reach it reports when sending', async () => {
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const channel = createChannel();

    const result = await channel.send({ warning, districts: TWO_DISTRICTS });

    expect(result).toEqual({
      success: true,
      recipients: channel.estimateRecipients(TWO_DISTRICTS),
    });
    expect(channel.estimateRecipients([])).toBe(0);
  });
});
