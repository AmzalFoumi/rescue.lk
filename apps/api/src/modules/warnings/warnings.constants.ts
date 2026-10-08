import type {
  AlertChannelType,
  DeliveryStatus,
  WarningSeverity,
  WarningStatus,
} from '@rescue-lk/shared';

// Runtime mirrors of the shared union types (packages/shared ships types only),
// used for schema enums and DTO validation.
export const ALERT_CHANNEL_TYPES: readonly AlertChannelType[] = [
  'push',
  'sms',
  'audible',
];

export const WARNING_SEVERITIES: readonly WarningSeverity[] = [
  'low',
  'moderate',
  'severe',
  'extreme',
];

export const WARNING_STATUSES: readonly WarningStatus[] = [
  'active',
  'cancelled',
  'expired',
];

export const DELIVERY_STATUSES: readonly DeliveryStatus[] = [
  'pending',
  'sent',
  'failed',
];

export const DEFAULT_WARNING_STATUS: WarningStatus = 'active';
export const DEFAULT_DELIVERY_STATUS: DeliveryStatus = 'pending';
export const INITIAL_DELIVERY_ATTEMPTS = 0;

export const WARNING_TITLE_MIN_LENGTH = 5;
export const WARNING_TITLE_MAX_LENGTH = 120;
export const WARNING_MESSAGE_MIN_LENGTH = 10;
export const WARNING_MESSAGE_MAX_LENGTH = 1000;

// Step 8.2 validateWarning: a warning may stay active for at most this long.
export const MAX_WARNING_DURATION_HOURS = 72;
export const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;
