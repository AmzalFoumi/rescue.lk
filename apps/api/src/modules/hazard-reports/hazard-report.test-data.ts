import { vi } from 'vitest';
import type { HazardReportRecord } from './hazard-report-record.js';
import { HazardReportStatus } from './hazard-report-status.js';
import type { HazardReportsRepository } from './hazard-reports.repository.interface.js';
import { HazardType } from './hazard-type.js';
import type { ReportSubmission } from './report-submission.js';
import { ReporterRole } from './reporter-role.js';

// Shared by the service tests, so the fake data is written once.

export const ID = '6ac71f73f776c0e7b5e78e36';
export const MISSING_ID = '000000000000000000000000';

export const submission: ReportSubmission = {
  hazardType: HazardType.Flood,
  description: 'Water is rising',
  location: { latitude: 6.9271, longitude: 79.8612 },
  district: '65f1a2b3c4d5e6f7a8b9c0d1',
  capturedAt: '2026-10-08T10:00:00Z',
  reporterId: 'citizen-001',
  reporterRole: ReporterRole.Citizen,
};

/** A fake stored report, close in place and time to `submission`. */
export function storedReport(
  overrides: Partial<HazardReportRecord> = {},
): HazardReportRecord {
  return {
    id: ID,
    hazardType: HazardType.Flood,
    description: 'Water is rising',
    location: { latitude: 6.9271, longitude: 79.8612 },
    district: submission.district,
    capturedAt: new Date('2026-10-08T08:00:00Z'),
    submittedAt: new Date('2026-10-08T08:00:00Z'),
    status: HazardReportStatus.PendingVerification,
    possibleDuplicateOf: [],
    reporterId: 'citizen-001',
    reporterRole: ReporterRole.Citizen,
    ...overrides,
  };
}

/** A repository whose methods are mocks, with simple default answers. */
export function fakeRepository(): HazardReportsRepository {
  return {
    create: vi.fn(async (report) =>
      storedReport({ ...report, id: 'new', submittedAt: new Date() }),
    ),
    findById: vi.fn().mockResolvedValue(storedReport()),
    findByStatus: vi.fn().mockResolvedValue([]),
    findByReporter: vi.fn().mockResolvedValue([]),
    findByTypeBetween: vi.fn().mockResolvedValue([]),
    updateStatus: vi.fn(async (_id, change) => storedReport({ ...change })),
  };
}
