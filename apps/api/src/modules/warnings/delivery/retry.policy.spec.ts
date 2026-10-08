import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { RetryPolicy, type RetryListener } from './retry.policy.js';
import type { ChannelSendResult } from '../channels/alert-channel.interface.js';
import { MANUAL_RETRY_ATTEMPTS } from '../warnings.constants.js';

const MAX_SEND_ATTEMPTS = 3;
const CONTEXT = 'SMS for warning 665f1b2c9d3e4a0012345670 v1';

const success: ChannelSendResult = { success: true, recipients: 240000 };
const failure = (error: string): ChannelSendResult => ({
  success: false,
  error,
});

const recordingListener = () => {
  const events: string[] = [];
  const listener: RetryListener = {
    beforeAttempt: vi.fn((attempt: number) => {
      events.push(`before ${attempt}`);
      return Promise.resolve();
    }),
    afterFailedAttempt: vi.fn(({ attempt, error, willRetry }) => {
      events.push(`failed ${attempt} ${error} retry=${willRetry}`);
      return Promise.resolve();
    }),
  };
  return { listener, events };
};

describe('RetryPolicy (loop 0..3 [send failed])', () => {
  let policy: RetryPolicy;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let listener: RetryListener;
  let events: string[];

  beforeEach(() => {
    const config = {
      getOrThrow: vi.fn().mockReturnValue(MAX_SEND_ATTEMPTS),
    } as unknown as ConfigService;
    policy = new RetryPolicy(config);
    warnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    ({ listener, events } = recordingListener());
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

    await expect(
      policy.execute({ operation, context: CONTEXT, listener }),
    ).resolves.toEqual({ result: success, attempts: 1 });
    expect(operation).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('retries failed sends until one succeeds', async () => {
    const operation = vi
      .fn()
      .mockResolvedValueOnce(failure('timeout'))
      .mockResolvedValueOnce(failure('timeout'))
      .mockResolvedValueOnce(success);

    await expect(
      policy.execute({ operation, context: CONTEXT, listener }),
    ).resolves.toEqual({ result: success, attempts: 3 });
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it('stops at MAX_SEND_ATTEMPTS and keeps the last error', async () => {
    const operation = vi
      .fn()
      .mockResolvedValueOnce(failure('first'))
      .mockResolvedValueOnce(failure('second'))
      .mockResolvedValueOnce(failure('last'));

    await expect(
      policy.execute({ operation, context: CONTEXT, listener }),
    ).resolves.toEqual({
      result: failure('last'),
      attempts: MAX_SEND_ATTEMPTS,
    });
    expect(operation).toHaveBeenCalledTimes(MAX_SEND_ATTEMPTS);
  });

  it('honours a smaller maxAttempts for a manual retry', async () => {
    const operation = vi.fn().mockResolvedValue(failure('timeout'));

    const outcome = await policy.execute({
      operation,
      context: CONTEXT,
      listener,
      maxAttempts: MANUAL_RETRY_ATTEMPTS,
    });

    expect(outcome.attempts).toBe(MANUAL_RETRY_ATTEMPTS);
    expect(operation).toHaveBeenCalledTimes(MANUAL_RETRY_ATTEMPTS);
  });

  it('treats a thrown error as a failed attempt and records its message', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('gateway down'));

    await expect(
      policy.execute({ operation, context: CONTEXT, listener }),
    ).resolves.toEqual({
      result: failure('gateway down'),
      attempts: MAX_SEND_ATTEMPTS,
    });
  });

  it('records a non-Error rejection as text', async () => {
    const operation = vi.fn().mockRejectedValue('connection reset');

    const { result } = await policy.execute({
      operation,
      context: CONTEXT,
      listener,
    });

    expect(result).toEqual(failure('connection reset'));
  });

  it('logs each failed attempt at warn level with its context', async () => {
    const operation = vi.fn().mockResolvedValue(failure('timeout'));

    await policy.execute({ operation, context: CONTEXT, listener });

    expect(warnSpy).toHaveBeenCalledTimes(MAX_SEND_ATTEMPTS);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(CONTEXT));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('timeout'));
  });

  it('tells the listener about every attempt and failure, in order', async () => {
    const operation = vi
      .fn()
      .mockResolvedValueOnce(failure('timeout'))
      .mockResolvedValueOnce(success);

    await policy.execute({ operation, context: CONTEXT, listener });

    expect(events).toEqual([
      'before 1',
      'failed 1 timeout retry=true',
      'before 2',
    ]);
  });

  it('marks the last failed attempt as not retrying', async () => {
    const operation = vi.fn().mockResolvedValue(failure('timeout'));

    await policy.execute({ operation, context: CONTEXT, listener });

    expect(events.at(-1)).toBe(
      `failed ${MAX_SEND_ATTEMPTS} timeout retry=false`,
    );
  });

  it('does not swallow a listener error: it stops the run and is rethrown', async () => {
    const operation = vi.fn().mockResolvedValue(success);
    vi.mocked(listener.beforeAttempt).mockRejectedValueOnce(
      new Error('status write failed'),
    );

    await expect(
      policy.execute({ operation, context: CONTEXT, listener }),
    ).rejects.toThrow('status write failed');
    expect(operation).not.toHaveBeenCalled();
  });
});
