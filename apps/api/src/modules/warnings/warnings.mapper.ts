import type {
  DeliveryRecordDto,
  WarningDeliveryResultDto,
  WarningDto,
} from '@rescue-lk/shared';
import type { WarningRecord } from './warnings.repository.interface.js';
import type { DeliveryRecordEntry } from './delivery-records.repository.interface.js';

// The single place that turns stored records into the shared API DTOs
// (Dates become ISO 8601 strings).

export const toWarningDto = (warning: WarningRecord): WarningDto => ({
  id: warning.id,
  hazardReportId: warning.hazardReportId,
  title: warning.title,
  message: warning.message,
  severity: warning.severity,
  districts: [...warning.districts],
  channels: [...warning.channels],
  status: warning.status,
  issuedAt: warning.issuedAt.toISOString(),
  expiresAt: warning.expiresAt.toISOString(),
});

export const toDeliveryRecordDto = (
  record: DeliveryRecordEntry,
): DeliveryRecordDto => ({
  id: record.id,
  warningId: record.warningId,
  channel: record.channel,
  status: record.status,
  attempts: record.attempts,
  ...(record.failureReason === undefined
    ? {}
    : { failureReason: record.failureReason }),
  ...(record.lastAttemptAt === undefined
    ? {}
    : { lastAttemptAt: record.lastAttemptAt.toISOString() }),
});

export const toWarningDeliveryResultDto = (
  warning: WarningRecord,
  deliveries: readonly DeliveryRecordEntry[],
): WarningDeliveryResultDto => ({
  warning: toWarningDto(warning),
  deliveries: deliveries.map(toDeliveryRecordDto),
});
