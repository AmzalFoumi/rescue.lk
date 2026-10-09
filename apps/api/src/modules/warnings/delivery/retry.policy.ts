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

// Parameter Object for one retry run.
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

// RetryPolicy tries a channel send again until it succeeds or the attempts run out
// (sequence diagram loop(0,3) [send failed]).
// SRP: it only decides when to try again; it never saves anything. The limit is
// MAX_SEND_ATTEMPTS from config, so there is no magic number and it can change per
// environment without code changes.
// Observer: a RetryListener is told about each attempt, so the caller decides what to
// record. A thrown send error counts as a failed attempt and is kept, never swallowed.
@Injectable()
export class RetryPolicy {
  private readonly logger = new Logger(RetryPolicy.name);
  private readonly defaultMaxAttempts: number;

  constructor(config: ConfigService) {
    this.defaultMaxAttempts = config.getOrThrow<number>('MAX_SEND_ATTEMPTS');
  }

  // Parameter Object (RetryRequest): a manual retry sets maxAttempts to 1 without a
  // second method. Observer: the listener hears every attempt, so this class never
  // touches the database (SRP).
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

  // A thrown send error becomes a failed result that keeps its message, so the loop
  // retries a crash like any other failure and execute() logs it.
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
