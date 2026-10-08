import { Logger } from '@nestjs/common';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import type { AlertChannel } from './alert-channel.interface.js';
import { FirstAttemptFailingChannel } from './first-attempt-failing.channel.js';
import { buildWarningRecord } from '../testing/warning.fixtures.js';

const DISTRICTS = ['Ratnapura'];

describe('FirstAttemptFailingChannel (demo decorator)', () => {
  let inner: AlertChannel;
  let channel: FirstAttemptFailingChannel;

  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    inner = {
      type: 'SMS',
      estimateRecipients: vi.fn().mockReturnValue(120000),
      send: vi.fn().mockResolvedValue({ success: true, recipients: 120000 }),
    };
    channel = new FirstAttemptFailingChannel(inner);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps the wrapped channel type and reach estimate', () => {
    expect(channel.type).toBe('SMS');
    expect(channel.estimateRecipients(DISTRICTS)).toBe(120000);
  });

  it('fails the first attempt, then sends through the real channel', async () => {
    const message = { warning: buildWarningRecord(), districts: DISTRICTS };

    await expect(channel.send(message)).resolves.toEqual({
      success: false,
      error: 'SMS gateway timeout (demo: first attempt fails)',
    });
    await expect(channel.send(message)).resolves.toEqual({
      success: true,
      recipients: 120000,
    });
    expect(inner.send).toHaveBeenCalledTimes(1);
  });

  it('fails once again for each new version of a warning', async () => {
    const v1 = {
      warning: buildWarningRecord({ version: 1 }),
      districts: DISTRICTS,
    };
    const v2 = {
      warning: buildWarningRecord({ version: 2 }),
      districts: DISTRICTS,
    };
    await channel.send(v1);
    await channel.send(v1);

    await expect(channel.send(v2)).resolves.toMatchObject({ success: false });
  });

  it('logs at warn level that the demo failure is switched on', () => {
    expect(Logger.prototype.warn).toHaveBeenCalledWith(
      expect.stringContaining('SMS'),
    );
  });
});
