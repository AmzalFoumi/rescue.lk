import { Logger } from '@nestjs/common';
import { describe, afterEach, it, expect, vi } from 'vitest';
import type { AlertChannel } from './alert-channel.interface.js';
import { PushChannel } from './push.channel.js';
import { SmsChannel } from './sms.channel.js';
import { AudibleChannel } from './audible.channel.js';
import type { WarningRecord } from '../warnings.repository.interface.js';

const warning: WarningRecord = {
  id: '665f1b2c9d3e4a0012345670',
  hazardReportId: '665f1b2c9d3e4a00000000a1',
  title: 'Flood warning',
  message: 'Move to higher ground immediately.',
  severity: 'severe',
  districts: ['665f1b2c9d3e4a00000000d1'],
  channels: ['push', 'sms', 'audible'],
  status: 'active',
  issuedAt: new Date('2026-10-08T12:00:00.000Z'),
  expiresAt: new Date('2026-10-08T18:00:00.000Z'),
};

describe.each<[AlertChannel['type'], () => AlertChannel]>([
  ['push', () => new PushChannel()],
  ['sms', () => new SmsChannel()],
  ['audible', () => new AudibleChannel()],
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

    await expect(createChannel().send(warning)).resolves.toEqual({
      success: true,
    });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(warning.id));
  });
});
