import type {
  DeliveryRecordDto,
  WarningDeliveryResultDto,
  WarningDto,
  SubmitWarningRequestDto,
  UpdateWarningRequestDto,
  WarningFormRequestDto,
} from '@rescue-lk/shared';
import type { WarningContent, WarningForm } from './domain/warning-form.js';
import type { SubmitWarningCommand } from './domain/warning-commands.js';
import { OTHER_HAZARD } from './warnings.constants.js';
import type { WarningRecord } from './warnings.repository.interface.js';
import type { DeliveryRecordEntry } from './delivery-records.repository.interface.js';

// warnings.mapper converts between the shared API DTOs and the module's own types:
// request DTO -> WarningForm/commands, and WarningRecord -> WarningDto.
// SRP: this is the single place for that conversion, so controllers and repositories
// never convert data themselves and a field rename is fixed in one place.
// Dates become ISO 8601 strings and missing dates stay null; text is trimmed and
// optional fields get defaults before validation.

// Request -> domain: trims text, defaults optional fields, and keeps otherHazard
// only when the hazard is 'other'.
export const toWarningContent = (
  request: UpdateWarningRequestDto,
): WarningContent => ({
  hazard: request.hazard,
  otherHazard:
    request.hazard === OTHER_HAZARD ? (request.otherHazard ?? '').trim() : '',
  severity: request.severity,
  areaIds: [...request.areaIds],
  message: request.message.trim(),
  instructions: (request.instructions ?? '').trim(),
  channels: [...(request.channels ?? [])],
});

export const toWarningForm = (request: WarningFormRequestDto): WarningForm => ({
  sourceReportId: request.sourceReportId,
  ...toWarningContent(request),
});

export const toSubmitWarningCommand = (
  request: SubmitWarningRequestDto,
): SubmitWarningCommand => ({
  form: toWarningForm(request),
  createdBy: request.createdBy.trim(),
  ...(request.draftId ? { draftId: request.draftId } : {}),
});

const toIsoOrNull = (date: Date | null): string | null =>
  date ? date.toISOString() : null;

export const toWarningDto = (warning: WarningRecord): WarningDto => ({
  id: warning.id,
  sourceReportId: warning.sourceReportId,
  hazard: warning.hazard,
  otherHazard: warning.otherHazard,
  severity: warning.severity,
  areaIds: [...warning.areaIds],
  message: warning.message,
  instructions: warning.instructions,
  channels: [...warning.channels],
  status: warning.status,
  version: warning.version,
  createdBy: warning.createdBy,
  createdAt: warning.createdAt.toISOString(),
  publishedAt: toIsoOrNull(warning.publishedAt),
  updatedAt: toIsoOrNull(warning.updatedAt),
  cancelledAt: toIsoOrNull(warning.cancelledAt),
  cancelReason: warning.cancelReason,
});

export const toDeliveryRecordDto = (
  record: DeliveryRecordEntry,
): DeliveryRecordDto => ({
  id: record.id,
  warningId: record.warningId,
  warningVersion: record.warningVersion,
  channel: record.channel,
  status: record.status,
  attempts: record.attempts,
  recipients: record.recipients,
  lastAttemptAt: toIsoOrNull(record.lastAttemptAt),
  error: record.error,
});

export const toWarningDeliveryResultDto = (
  warning: WarningRecord,
  deliveries: readonly DeliveryRecordEntry[],
): WarningDeliveryResultDto => ({
  warning: toWarningDto(warning),
  deliveries: deliveries.map(toDeliveryRecordDto),
});
