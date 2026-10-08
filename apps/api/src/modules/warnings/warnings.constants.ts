import type {
  AlertChannelType,
  DeliveryStatus,
  HazardType,
  TargetAreaKind,
  WarningSeverity,
  WarningStatus,
} from '@rescue-lk/shared';

// warnings.constants names every UC1 limit, starting value and allowed value once.
// No magic numbers or strings: schemas, DTOs and services import these names, so a
// limit is changed in one place (DRY).
// The lists mirror the shared union types at runtime (packages/shared ships types
// only) and are used for schema enums and DTO validation.
export const ALERT_CHANNEL_TYPES: readonly AlertChannelType[] = [
  'SMS',
  'PUSH',
  'SIREN',
];

export const WARNING_SEVERITIES: readonly WarningSeverity[] = [
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
];

export const WARNING_STATUSES: readonly WarningStatus[] = [
  'DRAFT',
  'ACTIVE',
  'CANCELLED',
];

export const DELIVERY_STATUSES: readonly DeliveryStatus[] = [
  'QUEUED',
  'SENT',
  'RETRYING',
  'FAILED',
];

export const HAZARD_TYPES: readonly HazardType[] = [
  'FLOOD',
  'LANDSLIDE',
  'ROAD_BLOCKAGE',
  'FIRE',
  'OTHER',
];

export const TARGET_AREA_KINDS: readonly TargetAreaKind[] = [
  'DISTRICT',
  'RIVER_BASIN',
];

// The hazard type that needs a free-text name (otherHazard).
export const OTHER_HAZARD: HazardType = 'OTHER';

export const INITIAL_DELIVERY_STATUS: DeliveryStatus = 'QUEUED';
export const INITIAL_WARNING_VERSION = 1;
export const INITIAL_DELIVERY_ATTEMPTS = 0;
export const NO_RECIPIENTS = 0;
export const NO_ERROR = '';

// A manual retry after FAILED makes exactly one more attempt.
export const MANUAL_RETRY_ATTEMPTS = 1;

export const WARNING_MESSAGE_MIN_LENGTH = 20;
export const WARNING_MESSAGE_MAX_LENGTH = 1000;
export const WARNING_INSTRUCTIONS_MAX_LENGTH = 2000;
export const OTHER_HAZARD_MAX_LENGTH = 80;
export const CANCEL_REASON_MAX_LENGTH = 500;
export const CREATED_BY_MAX_LENGTH = 120;
