import type { AlertChannelType } from '@rescue-lk/shared';
import type { WarningRecord } from '../warnings.repository.interface.js';

// Strategy pattern: one implementation per delivery channel. All implementations
// are injected together as a list under this token.
export const ALERT_CHANNELS = Symbol('ALERT_CHANNELS');

export interface ChannelSendResult {
  success: boolean;
  failureReason?: string;
}

// Sequence diagram: push/sms/audible:AlertChannel lifelines, send() inside par.
export interface AlertChannel {
  readonly type: AlertChannelType;
  send(warning: WarningRecord): Promise<ChannelSendResult>;
}
