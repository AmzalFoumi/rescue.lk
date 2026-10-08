import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ChannelSendResult } from '../channels/alert-channel.interface.js';

export type SendOperation = () => Promise<ChannelSendResult>;

export interface FailedAttempt {
  // Attempt number within this run, starting at 1.
  attempt: number;
  error: string;
  // False for the last attempt of the run.
  willRetry: boolean;
}

// Observer: told about each attempt so the caller can record progress
// (QUEUED -> RETRYING -> FAILED). Errors it throws are not caught here.
export interface RetryListener {
  beforeAttempt(attempt: number): Promise<void>;
  afterFailedAttempt(failure: FailedAttempt): Promise<void>;
}

// Parameter object for one retry run.
export interface RetryRequest {
  operation: SendOperation;
  // Who is being retried, for the logs (e.g. "SMS for warning 665f... v2").
  context: string;
  listener: RetryListener;
  // Defaults to MAX_SEND_ATTEMPTS; a manual retry asks for one attempt.
  maxAttempts?: number;
}

export interface RetryOutcome {
  result: ChannelSendResult;
  // Attempts made in this run.
  attempts: number;
}

// Sequence diagram loop(0,3) [send failed]: re-attempts a channel send up to
// MAX_SEND_ATTEMPTS. A thrown send error counts as a failed attempt; its
// message is kept as the error and logged, so it is recorded rather than lost.
@Injectable()
export class RetryPolicy {
  private readonly logger = new Logger(RetryPolicy.name);
  private readonly defaultMaxAttempts: number;

  constructor(config: ConfigService) {
    this.defaultMaxAttempts = config.getOrThrow<number>('MAX_SEND_ATTEMPTS');
  }

  async execute({
    operation,
    context,
    listener,
    maxAttempts = this.defaultMaxAttempts,
  }: RetryRequest): Promise<RetryOutcome> {
    let attempts = 0;
    let result: ChannelSendResult;

    do {
      attempts += 1;
      await listener.beforeAttempt(attempts);
      result = await this.attempt(operation);
      if (result.success) {
        return { result, attempts };
      }
      this.logger.warn(
        `Send attempt ${attempts}/${maxAttempts} failed for ${context}: ${result.error}`,
      );
      await listener.afterFailedAttempt({
        attempt: attempts,
        error: result.error,
        willRetry: attempts < maxAttempts,
      });
    } while (attempts < maxAttempts);

    return { result, attempts };
  }

  private async attempt(operation: SendOperation): Promise<ChannelSendResult> {
    try {
      return await operation();
    } catch (error) {
      return { success: false, error: describeError(error) };
    }
  }
}

const describeError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
