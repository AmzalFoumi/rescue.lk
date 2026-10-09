import { describe, expect, it } from 'vitest';
import { UNKNOWN_DISTRICT_NAME } from '../warnings.constants.js';
import {
  StoredHazardReport,
  toHazardReportSummary,
  toVerifiedReport,
} from './hazard-report.mapper.js';

const DISTRICT_ID = '665f1b2c9d3e4a00000000d1';

const stored = (
  overrides: Partial<StoredHazardReport> = {},
): StoredHazardReport => ({
  id: '665f1b2c9d3e4a00000000a1',
  hazardType: 'flood',
  description: 'River overflowing near the bridge',
  placeName: 'Ratnapura town',
  reporterName: 'Nimal Perera',
  reporterId: 'citizen-nimal',
  district: DISTRICT_ID,
  status: 'verified',
  capturedAt: new Date('2026-10-08T01:00:00.000Z'),
  createdAt: new Date('2026-10-08T01:05:00.000Z'),
  verifiedAt: new Date('2026-10-08T01:30:00.000Z'),
  verifiedBy: 'operator-kj',
  ...overrides,
});

describe('toHazardReportSummary', () => {
  it('copies the report and turns dates into ISO strings', () => {
    expect(toHazardReportSummary(stored(), 'Ratnapura')).toEqual({
      id: '665f1b2c9d3e4a00000000a1',
      hazardType: 'flood',
      district: DISTRICT_ID,
      districtName: 'Ratnapura',
      place: 'Ratnapura town',
      reporter: 'Nimal Perera',
      status: 'verified',
      description: 'River overflowing near the bridge',
      submittedAt: '2026-10-08T01:05:00.000Z',
      verifiedAt: '2026-10-08T01:30:00.000Z',
      verifiedBy: 'operator-kj',
    });
  });

  it('uses the capture time when the report has no created time', () => {
    const summary = toHazardReportSummary(
      stored({ createdAt: undefined }),
      'Ratnapura',
    );
    expect(summary.submittedAt).toBe('2026-10-08T01:00:00.000Z');
  });

  it('uses the district name as the place when no place was entered', () => {
    const summary = toHazardReportSummary(
      stored({ placeName: undefined }),
      'Ratnapura',
    );
    expect(summary.place).toBe('Ratnapura');
  });

  it('treats a blank place or reporter name as missing', () => {
    const summary = toHazardReportSummary(
      stored({ placeName: '   ', reporterName: '  ' }),
      'Ratnapura',
    );
    expect(summary.place).toBe('Ratnapura');
    expect(summary.reporter).toBe('citizen-nimal');
  });

  it('falls back to the reporter id when no reporter name was entered', () => {
    const summary = toHazardReportSummary(
      stored({ reporterName: undefined }),
      'Ratnapura',
    );
    expect(summary.reporter).toBe('citizen-nimal');
  });

  it('names an unknown district instead of leaving it empty', () => {
    const summary = toHazardReportSummary(stored({ placeName: undefined }));
    expect(summary.districtName).toBe(UNKNOWN_DISTRICT_NAME);
    expect(summary.place).toBe(UNKNOWN_DISTRICT_NAME);
  });

  it('has no verification details for a report that is not verified', () => {
    const summary = toHazardReportSummary(
      stored({
        status: 'pending_verification',
        verifiedAt: undefined,
        verifiedBy: undefined,
      }),
      'Ratnapura',
    );
    expect(summary.status).toBe('pending_verification');
    expect(summary.verifiedAt).toBeNull();
    expect(summary.verifiedBy).toBeNull();
  });
});

describe('toVerifiedReport', () => {
  it('keeps a verified report with who verified it and when', () => {
    const summary = toHazardReportSummary(stored(), 'Ratnapura');
    expect(toVerifiedReport(summary)).toEqual(summary);
  });

  it.each([
    'pending_verification',
    'pending_synchronisation',
    'rejected',
  ] as const)('drops a %s report', (status) => {
    const summary = toHazardReportSummary(stored({ status }), 'Ratnapura');
    expect(toVerifiedReport(summary)).toBeNull();
  });

  it('drops a verified report that has no verification time', () => {
    const summary = toHazardReportSummary(
      stored({ verifiedAt: undefined }),
      'Ratnapura',
    );
    expect(toVerifiedReport(summary)).toBeNull();
  });

  it('drops a verified report that does not say who verified it', () => {
    const summary = toHazardReportSummary(
      stored({ verifiedBy: undefined }),
      'Ratnapura',
    );
    expect(toVerifiedReport(summary)).toBeNull();
  });
});
