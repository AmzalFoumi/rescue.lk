import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { RetryPolicy } from './retry.policy.js';
import type { ChannelSendResult } from '../channels/alert-channel.interface.js';

const MAX_SEND_ATTEMPTS = 3;
const CONTEXT = 'sms for warning 665f1b2c9d3e4a0012345670';

const success: ChannelSendResult = { success: true };
const failure = (failureReason: string): ChannelSendResult => ({
  success: false,
  failureReason,
});

describe('RetryPolicy (loop 0..3 [send failed])', () => {
  let policy: RetryPolicy;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    const config = {
      getOrThrow: vi.fn().mockReturnValue(MAX_SEND_ATTEMPTS),
    } as unknown as ConfigService;
    policy = new RetryPolicy(config);
    warnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads MAX_SEND_ATTEMPTS from config', () => {
    const getOrThrow = vi.fn().mockReturnValue(MAX_SEND_ATTEMPTS);
    new RetryPolicy({ getOrThrow } as unknown as ConfigService);

    expect(getOrThrow).toHaveBeenCalledWith('MAX_SEND_ATTEMPTS');
  });

  it('returns after one attempt when the first send succeeds', async () => {
    const operation = vi.fn().mockResolvedValue(success);

    await expect(policy.execute(operation, CONTEXT)).resolves.toEqual({
      result: success,
      attempts: 1,
    });
    expect(operation).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('retries failed sends until one succeeds', async () => {
    const operation = vi
      .fn()
      .mockResolvedValueOnce(failure('timeout'))
      .mockResolvedValueOnce(failure('timeout'))
      .mockResolvedValueOnce(success);

    await expect(policy.execute(operation, CONTEXT)).resolves.toEqual({
      result: success,
      attempts: 3,
    });
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it('stops at MAX_SEND_ATTEMPTS and keeps the last failure reason', async () => {
    const operation = vi
      .fn()
      .mockResolvedValueOnce(failure('first'))
      .mockResolvedValueOnce(failure('second'))
      .mockResolvedValueOnce(failure('last'));

    await expect(policy.execute(operation, CONTEXT)).resolves.toEqual({
      result: failure('last'),
      attempts: MAX_SEND_ATTEMPTS,
    });
    expect(operation).toHaveBeenCalledTimes(MAX_SEND_ATTEMPTS);
  });

  it('treats a thrown error as a failed attempt and records its message', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('gateway down'));

    await expect(policy.execute(operation, CONTEXT)).resolves.toEqual({
      result: failure('gateway down'),
      attempts: MAX_SEND_ATTEMPTS,
    });
  });

  it('records a non-Error rejection as text', async () => {
    const operation = vi.fn().mockRejectedValue('connection reset');

    const { result } = await policy.execute(operation, CONTEXT);

    expect(result).toEqual(failure('connection reset'));
  });

  it('logs each failed attempt at warn level with its context', async () => {
    const operation = vi.fn().mockResolvedValue(failure('timeout'));

    await policy.execute(operation, CONTEXT);

    expect(warnSpy).toHaveBeenCalledTimes(MAX_SEND_ATTEMPTS);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(CONTEXT));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('timeout'));
  });
});
