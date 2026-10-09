import type { VerifiedHazardReportDto } from '@rescue-lk/shared';
import type { Clock } from '../domain/clock.js';
import type { WarningForm } from '../domain/warning-form.js';
import type { WarningRecord } from '../warnings.repository.interface.js';
import type { DeliveryRecordEntry } from '../delivery-records.repository.interface.js';

// Shared test data for the warnings specs.
export const FIXED_NOW = new Date('2026-10-08T12:00:00.000Z');
export const EARLIER = new Date('2026-10-08T09:00:00.000Z');
export const WARNING_ID = '665f1b2c9d3e4a0012345670';
export const OFFICER = 'Assessment Officer';

export const fixedClock: Clock = { now: () => new Date(FIXED_NOW) };

export const VERIFIED_REPORT: VerifiedHazardReportDto = {
  id: '665f1b2c9d3e4a00000000a1',
  hazardType: 'flood',
  district: '665f1b2c9d3e4a00000000d1',
  districtName: 'Ratnapura',
  place: 'Ratnapura town',
  reporter: 'Nimal Perera',
  status: 'verified',
  description: 'Kalu Ganga overflowing near Ratnapura',
  submittedAt: '2026-10-08T08:10:00.000Z',
  verifiedAt: '2026-10-08T08:40:00.000Z',
  verifiedBy: 'K. Jayawardena',
};

export const buildWarningForm = (
  overrides: Partial<WarningForm> = {},
): WarningForm => ({
  sourceReportId: VERIFIED_REPORT.id,
  hazard: 'flood',
  otherHazard: '',
  severity: 'HIGH',
  areaIds: ['B-KALU'],
  message: 'The Kalu Ganga is rising quickly near Ratnapura.',
  instructions: 'Move to higher ground.',
  channels: ['SMS', 'PUSH'],
  ...overrides,
});

export const buildWarningRecord = (
  overrides: Partial<WarningRecord> = {},
): WarningRecord => ({
  id: WARNING_ID,
  ...buildWarningForm(),
  status: 'ACTIVE',
  version: 1,
  createdBy: OFFICER,
  createdAt: new Date(EARLIER),
  publishedAt: new Date(EARLIER),
  updatedAt: null,
  cancelledAt: null,
  cancelReason: '',
  ...overrides,
});

export const buildDeliveryRecord = (
  overrides: Partial<DeliveryRecordEntry> = {},
): DeliveryRecordEntry => ({
  id: '665f1b2c9d3e4a0012345671',
  warningId: WARNING_ID,
  warningVersion: 1,
  channel: 'SMS',
  status: 'SENT',
  attempts: 1,
  recipients: 240000,
  lastAttemptAt: new Date(FIXED_NOW),
  error: '',
  ...overrides,
});
