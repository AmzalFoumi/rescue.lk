import { describe, expect, it } from 'vitest';
import type { DistrictDto, HazardReportDto } from '@rescue-lk/shared';
import type { QueuedReport } from './queued-report';
import {
  DUPLICATE_NOTICE,
  QUEUED_NOTICE,
  describePlace,
  queuedToReportCard,
  toReportCard,
} from './report-card';

const districts: DistrictDto[] = [
  {
    id: 'd-rat',
    name: 'Ratnapura',
    province: 'Sabaragamuwa',
    latitude: 6.68,
    longitude: 80.39,
  },
];

const report: HazardReportDto = {
  id: '6ac71f73f776c0e7b5e78e36',
  hazardType: 'flood',
  description: 'Water is rising',
  location: { latitude: 6.6828, longitude: 80.3992 },
  district: 'd-rat',
  capturedAt: '2026-10-07T10:40:00.000Z',
  submittedAt: '2026-10-07T10:40:02.000Z',
  status: 'pending_verification',
  possibleDuplicateOf: [],
  reporterId: 'citizen-nimal',
  reporterRole: 'citizen',
};

describe('describePlace', () => {
  it('joins the landmark and the district', () => {
    expect(
      describePlace({ ...report, placeName: 'Kuruwita bridge' }, districts),
    ).toBe('Kuruwita bridge, Ratnapura');
  });

  it('uses only the landmark when the district is unknown', () => {
    expect(
      describePlace(
        { ...report, district: 'nope', placeName: 'Kuruwita bridge' },
        districts,
      ),
    ).toBe('Kuruwita bridge');
  });

  it('uses the district when there is no landmark', () => {
    expect(describePlace(report, districts)).toBe('Ratnapura');
  });

  it('falls back to the coordinates', () => {
    expect(describePlace({ ...report, district: 'nope' }, districts)).toBe(
      '6.6828° N, 80.3992° E',
    );
  });
});

describe('toReportCard', () => {
  it('builds the basic card from a pending report', () => {
    const card = toReportCard(report, districts);
    expect(card).toMatchObject({
      key: report.id,
      title: 'Flood',
      icon: 'waves',
      shortId: 'R-8E36',
      place: 'Ratnapura',
      status: 'pending_verification',
      notes: [],
      possibleDuplicate: false,
    });
  });

  it('shows what the reporter typed for the "other" type', () => {
    expect(
      toReportCard(
        { ...report, hazardType: 'other', otherHazard: 'Fallen power line' },
        districts,
      ).title,
    ).toBe('Fallen power line');
  });

  it('flags a pending report that has possible duplicates', () => {
    const card = toReportCard(
      { ...report, possibleDuplicateOf: ['x'] },
      districts,
    );
    expect(card.possibleDuplicate).toBe(true);
    expect(DUPLICATE_NOTICE).toContain('Possible duplicate');
  });

  it('does not flag duplicates once the report has a decision', () => {
    expect(
      toReportCard(
        { ...report, status: 'verified', possibleDuplicateOf: ['x'] },
        districts,
      ).possibleDuplicate,
    ).toBe(false);
  });

  it('says who verified the report and when', () => {
    const card = toReportCard(
      {
        ...report,
        status: 'verified',
        verifiedBy: 'operator-kj',
        verifiedAt: '2026-10-07T10:42:00.000Z',
      },
      districts,
    );
    expect(card.notes[0]).toMatch(/^Verified by K\. Jayawardena on /);
  });

  it('shows the reason and the decider for a rejected report', () => {
    const card = toReportCard(
      {
        ...report,
        status: 'rejected',
        rejectionReason: 'Insufficient information',
        verifiedBy: 'operator-kj',
        verifiedAt: '2026-10-07T10:42:00.000Z',
      },
      districts,
    );
    expect(card.notes[0]).toBe('Reason: Insufficient information');
    expect(card.notes[1]).toMatch(/^K\. Jayawardena · /);
  });

  it('copes with a rejected report that has no reason or decider', () => {
    const card = toReportCard({ ...report, status: 'rejected' }, districts);
    expect(card.notes).toEqual(['Reason: not given']);
  });

  it('has no notes for a verified report without decider details', () => {
    expect(
      toReportCard({ ...report, status: 'verified' }, districts).notes,
    ).toEqual([]);
  });
});

describe('queuedToReportCard', () => {
  const queued: QueuedReport = {
    localId: 'local-1',
    savedAt: '2026-10-08T09:00:00.000Z',
    request: {
      hazardType: 'fire',
      description: 'Smoke near the market',
      location: { latitude: 6.68, longitude: 80.39 },
      district: 'd-rat',
      capturedAt: '2026-10-08T09:00:00.000Z',
      reporterId: 'citizen-nimal',
      reporterRole: 'citizen',
    },
  };

  it('shows a report that is still on the phone', () => {
    expect(queuedToReportCard(queued, districts)).toMatchObject({
      key: 'local-1',
      title: 'Fire',
      status: 'pending_synchronisation',
      notes: [QUEUED_NOTICE],
      possibleDuplicate: false,
    });
  });

  it('has no short id because the server has not given it a real id yet', () => {
    expect(queuedToReportCard(queued, districts).shortId).toBeUndefined();
  });
});
