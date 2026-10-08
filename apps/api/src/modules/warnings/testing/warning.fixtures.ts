import type { VerifiedHazardReportDto } from '@rescue-lk/shared';
import type { Clock } from '../domain/clock.js';
import type { IssueWarningCommand } from '../domain/issue-warning.command.js';
import type { WarningRecord } from '../warnings.repository.interface.js';
import { MILLISECONDS_PER_HOUR } from '../warnings.constants.js';

// Shared test data for the warnings specs.
export const FIXED_NOW = new Date('2026-10-08T12:00:00.000Z');
export const WARNING_ID = '665f1b2c9d3e4a0012345670';
export const REPORT_DISTRICT_ID = '665f1b2c9d3e4a00000000d1';

export const fixedClock: Clock = { now: () => new Date(FIXED_NOW) };

export const VERIFIED_REPORT: VerifiedHazardReportDto = {
  id: '665f1b2c9d3e4a00000000a1',
  hazardType: 'flood',
  district: REPORT_DISTRICT_ID,
  status: 'verified',
  description: 'Kelani River overflowing',
};

export const buildIssueWarningCommand = (
  overrides: Partial<IssueWarningCommand> = {},
): IssueWarningCommand => ({
  hazardReportId: VERIFIED_REPORT.id,
  title: 'Flood warning',
  message: 'Move to higher ground immediately.',
  severity: 'severe',
  districts: [REPORT_DISTRICT_ID],
  channels: ['push', 'sms'],
  expiresAt: new Date(FIXED_NOW.getTime() + MILLISECONDS_PER_HOUR),
  ...overrides,
});

export const buildWarningRecord = (
  overrides: Partial<WarningRecord> = {},
): WarningRecord => ({
  id: WARNING_ID,
  hazardReportId: VERIFIED_REPORT.id,
  title: 'Flood warning',
  message: 'Move to higher ground immediately.',
  severity: 'severe',
  districts: [REPORT_DISTRICT_ID],
  channels: ['push', 'sms'],
  status: 'active',
  issuedAt: new Date(FIXED_NOW),
  expiresAt: new Date(FIXED_NOW.getTime() + MILLISECONDS_PER_HOUR),
  ...overrides,
});
