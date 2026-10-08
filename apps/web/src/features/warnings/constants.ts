import type { DeliveryStatus } from '@rescue-lk/shared';

// How often the delivery table refreshes while a channel is still sending.
export const DELIVERY_POLL_INTERVAL_MS = 2000;

// Deliveries in these states may still change, so the table keeps polling.
export const IN_PROGRESS_DELIVERY_STATUSES: readonly DeliveryStatus[] = [
  'QUEUED',
  'RETRYING',
];

// The hazard type that needs a typed name.
export const OTHER_HAZARD = 'OTHER';

// Who is recorded as creating a warning until login exists.
export const CREATED_BY = 'Assessment Officer';

// Mirrors of the API limits, used only for input hints and maxLength; the API
// (WarningValidator and the request DTOs) remains the source of truth.
export const MESSAGE_MIN_LENGTH = 20;
export const MESSAGE_MAX_LENGTH = 1000;
export const INSTRUCTIONS_MAX_LENGTH = 2000;
export const OTHER_HAZARD_MAX_LENGTH = 80;
export const CANCEL_REASON_MAX_LENGTH = 500;
// The API's default MAX_SEND_ATTEMPTS, for the note under the delivery table.
export const AUTOMATIC_SEND_ATTEMPTS = 3;

// Times are shown in Sri Lanka time.
export const DISPLAY_TIME_ZONE = 'Asia/Colombo';

// SMS length limits: one message holds 160 characters; a longer message is
// split into parts of 153 (7 are used to join the parts).
export const SMS_SINGLE_LENGTH = 160;
export const SMS_PART_LENGTH = 153;

// How long a confirmation toast stays on screen.
export const TOAST_DURATION_MS = 5000;
