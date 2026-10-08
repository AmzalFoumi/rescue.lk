import type { AlertChannelType } from '@rescue-lk/shared';
import type { WarningRecord } from '../warnings.repository.interface.js';

// Strategy pattern: one implementation per delivery channel. All implementations
// are injected together as a list under this token.
export const ALERT_CHANNELS = Symbol('ALERT_CHANNELS');

// Parameter object: what a channel needs to send one warning.
export interface ChannelMessage {
  warning: WarningRecord;
  // District names the warning's areas resolve to.
  districts: string[];
}

export type ChannelSendResult =
  { success: true; recipients: number } | { success: false; error: string };

// Sequence diagram: SMS/PUSH/SIREN AlertChannel lifelines, send() inside par.
export interface AlertChannel {
  readonly type: AlertChannelType;
  // Expected reach for these districts, shown before a warning is sent.
  estimateRecipients(districts: readonly string[]): number;
  send(message: ChannelMessage): Promise<ChannelSendResult>;
}
