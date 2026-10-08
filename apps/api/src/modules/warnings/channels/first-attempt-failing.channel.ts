import { Logger } from '@nestjs/common';
import type { AlertChannelType } from '@rescue-lk/shared';
import type {
  AlertChannel,
  ChannelMessage,
  ChannelSendResult,
} from './alert-channel.interface.js';

// DEMO ONLY (Decorator pattern): wraps a real channel so that the first send
// of each warning version fails, then every later attempt goes through. This
// makes RetryPolicy's loop(0,3) [send failed] visible: the channel ends SENT
// after 2 attempts. Switched on per channel by MOCK_FAIL_FIRST_ATTEMPT_CHANNELS.
export class FirstAttemptFailingChannel implements AlertChannel {
  private readonly logger = new Logger(FirstAttemptFailingChannel.name);
  // Warning versions whose first attempt has already failed.
  private readonly failedOnce = new Set<string>();

  constructor(private readonly inner: AlertChannel) {
    this.logger.warn(
      `Demo mode: ${inner.type} fails the first attempt of every warning version`,
    );
  }

  get type(): AlertChannelType {
    return this.inner.type;
  }

  estimateRecipients(districts: readonly string[]): number {
    return this.inner.estimateRecipients(districts);
  }

  send(message: ChannelMessage): Promise<ChannelSendResult> {
    const key = `${message.warning.id}:v${message.warning.version}`;
    if (this.failedOnce.has(key)) {
      return this.inner.send(message);
    }
    this.failedOnce.add(key);
    return Promise.resolve({
      success: false,
      error: `${this.type} gateway timeout (demo: first attempt fails)`,
    });
  }
}
