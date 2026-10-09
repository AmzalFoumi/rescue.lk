import type { AlertChannelType } from '@rescue-lk/shared';
import { ALERT_CHANNEL_TYPES } from '../warnings.constants.js';
import type { AlertChannel } from './alert-channel.interface.js';
import { FirstAttemptFailingChannel } from './first-attempt-failing.channel.js';

// "SMS,SIREN" -> ['SMS', 'SIREN']. The format is checked when the app starts
// (env.validation.ts); anything that is not a channel type is ignored here.
export const parseChannelList = (
  value: string | undefined,
): AlertChannelType[] =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is AlertChannelType =>
      ALERT_CHANNEL_TYPES.includes(item as AlertChannelType),
    );

// DEMO ONLY: wraps the channels named in MOCK_FAIL_FIRST_ATTEMPT_CHANNELS in
// FirstAttemptFailingChannel, so the retry loop can be shown in a demo.
// SRP: it only decides which channels to wrap. The rest are returned unchanged and in
// the same order, so with the setting empty the app behaves exactly as normal.
// Decorator: the real channels are wrapped, never edited (OCP).
export const withDemoFailures = (
  channels: readonly AlertChannel[],
  failFirstAttempt: readonly AlertChannelType[],
): AlertChannel[] =>
  channels.map((channel) =>
    failFirstAttempt.includes(channel.type)
      ? new FirstAttemptFailingChannel(channel)
      : channel,
  );
