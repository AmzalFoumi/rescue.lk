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

// DEMO ONLY: wraps the named channels so their first attempt fails; the rest
// are returned unchanged, in the same order.
export const withDemoFailures = (
  channels: readonly AlertChannel[],
  failFirstAttempt: readonly AlertChannelType[],
): AlertChannel[] =>
  channels.map((channel) =>
    failFirstAttempt.includes(channel.type)
      ? new FirstAttemptFailingChannel(channel)
      : channel,
  );
