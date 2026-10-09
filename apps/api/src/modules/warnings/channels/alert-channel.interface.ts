import type { AlertChannelType } from '@rescue-lk/shared';
import type { WarningRecord } from '../warnings.repository.interface.js';

// DI token for the list of every AlertChannel, injected together into ChannelRegistry.
export const ALERT_CHANNELS = Symbol('ALERT_CHANNELS');

// Parameter object: what a channel needs to send one warning.
export interface ChannelMessage {
  warning: WarningRecord;
  // District names the warning's areas resolve to.
  districts: string[];
}

export type ChannelSendResult =
  { success: true; recipients: number } | { success: false; error: string };

// AlertChannel is the contract every delivery channel follows: SMS, push and siren.
// Strategy pattern: each channel is one interchangeable class behind this interface,
// and the delivery code only ever calls send() and estimateRecipients().
// OCP: a new channel (e.g. email) is one new class plus one line in
// warnings.module.ts; no existing code changes.
// LSP: any channel can stand in for another, so the delivery flow never checks types.
// Sequence diagram: the SMS/PUSH/SIREN AlertChannel lifelines inside the par fragment.
export interface AlertChannel {
  readonly type: AlertChannelType;
  // Expected reach for these districts, shown before a warning is sent.
  estimateRecipients(districts: readonly string[]): number;
  send(message: ChannelMessage): Promise<ChannelSendResult>;
}
