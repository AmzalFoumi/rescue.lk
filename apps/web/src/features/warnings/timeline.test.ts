import { describe, it, expect } from 'vitest';
import type { VerifiedHazardReportDto, WarningDto } from '@rescue-lk/shared';
import { reportTimeline, sameDayReports, warningEvents } from './timeline';

const AREA_NAMES = { 'B-KALU': 'Kalu Ganga basin' };

const report = (
  id: string,
  overrides: Partial<VerifiedHazardReportDto> = {},
): VerifiedHazardReportDto => ({
  id,
  hazardType: 'FLOOD',
  district: 'd',
  districtName: 'Ratnapura',
  place: 'Ratnapura town',
  reporter: 'Nimal Perera',
  status: 'verified',
  description: 'Kalu Ganga overflowing',
  submittedAt: '2026-10-08T03:55:00.000Z',
  verifiedAt: '2026-10-08T04:20:00.000Z',
  verifiedBy: 'K. Jayawardena',
  ...overrides,
});

const warning = (overrides: Partial<WarningDto> = {}): WarningDto => ({
  id: '665f1b2c9d3e4a0012345670',
  sourceReportId: 'r1',
  hazard: 'FLOOD',
  otherHazard: '',
  severity: 'HIGH',
  areaIds: ['B-KALU'],
  message: 'm',
  instructions: 'i',
  channels: ['SMS'],
  status: 'ACTIVE',
  version: 1,
  createdBy: 'S. Wickramasinghe',
  createdAt: '2026-10-08T05:00:00.000Z',
  publishedAt: '2026-10-08T05:10:00.000Z',
  updatedAt: null,
  cancelledAt: null,
  cancelReason: '',
  ...overrides,
});

describe('warningEvents', () => {
  it('describes creation and publication', () => {
    expect(warningEvents(warning(), AREA_NAMES)).toEqual([
      {
        at: '2026-10-08T05:00:00.000Z',
        kind: 'created',
        text: 'W-345670 created by S. Wickramasinghe.',
      },
      {
        at: '2026-10-08T05:10:00.000Z',
        kind: 'published',
        text: 'W-345670 published as High for Kalu Ganga basin.',
      },
    ]);
  });

  it('adds an update and a cancellation when they happened', () => {
    const events = warningEvents(
      warning({
        status: 'CANCELLED',
        version: 2,
        updatedAt: '2026-10-08T06:00:00.000Z',
        cancelledAt: '2026-10-08T07:00:00.000Z',
        cancelReason: 'River level has fallen.',
      }),
      AREA_NAMES,
    );

    expect(events.map((event) => event.text)).toEqual([
      'W-345670 created by S. Wickramasinghe.',
      'W-345670 published as High for Kalu Ganga basin.',
      'W-345670 updated to version 2.',
      'W-345670 cancelled: River level has fallen.',
    ]);
  });

  it('does not call saving a draft an update', () => {
    const events = warningEvents(
      warning({
        status: 'DRAFT',
        publishedAt: null,
        updatedAt: '2026-10-08T06:00:00.000Z',
      }),
      AREA_NAMES,
    );

    expect(events.map((event) => event.kind)).toEqual(['created']);
  });
});

describe('reportTimeline', () => {
  it('lists the report and its warnings, newest first', () => {
    const events = reportTimeline(report('r1'), [warning()], AREA_NAMES);

    expect(events.map((event) => [event.kind, event.text])).toEqual([
      ['published', 'W-345670 published as High for Kalu Ganga basin.'],
      ['created', 'W-345670 created by S. Wickramasinghe.'],
      ['verified', 'Verified by K. Jayawardena.'],
      ['reported', 'Reported by Nimal Perera through the rescue.lk app.'],
    ]);
  });
});

describe('sameDayReports', () => {
  it('finds other verified reports from the same district within a day', () => {
    const subject = report('r1');
    const reports = [
      subject,
      report('r2', { submittedAt: '2026-10-08T20:00:00.000Z' }),
      report('r3', { submittedAt: '2026-10-09T05:00:00.000Z' }),
      report('r4', { districtName: 'Badulla' }),
    ];

    expect(sameDayReports(subject, reports).map((r) => r.id)).toEqual(['r2']);
  });
});
