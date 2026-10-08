import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ChannelSendResult } from '../channels/alert-channel.interface.js';

export type SendOperation = () => Promise<ChannelSendResult>;

export interface RetryOutcome {
  result: ChannelSendResult;
  attempts: number;
}

// Sequence diagram loop(0,3) [send failed]: re-attempts a channel send up to
// MAX_SEND_ATTEMPTS. A thrown error counts as a failed attempt; its message is
// kept as the failure reason and logged, so it is recorded rather than lost.
@Injectable()
export class RetryPolicy {
  private readonly logger = new Logger(RetryPolicy.name);
  private readonly maxAttempts: number;

  constructor(config: ConfigService) {
    this.maxAttempts = config.getOrThrow<number>('MAX_SEND_ATTEMPTS');
  }

  async execute(
    operation: SendOperation,
    context: string,
  ): Promise<RetryOutcome> {
    let attempts = 0;
    let result: ChannelSendResult;

    do {
      attempts += 1;
      result = await this.attempt(operation);
      if (result.success) {
        return { result, attempts };
      }
      this.logger.warn(
        `Send attempt ${attempts}/${this.maxAttempts} failed for ${context}: ${result.failureReason}`,
      );
    } while (attempts < this.maxAttempts);

    return { result, attempts };
  }

  private async attempt(operation: SendOperation): Promise<ChannelSendResult> {
    try {
      return await operation();
    } catch (error) {
      return { success: false, failureReason: describeError(error) };
    }
  }
}

const describeError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
