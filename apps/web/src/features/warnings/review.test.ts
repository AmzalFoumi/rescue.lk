import { describe, it, expect } from 'vitest';
import type { VerifiedHazardReportDto, WarningDto } from '@rescue-lk/shared';
import { buildReviewView } from './review';

const report = (id: string): VerifiedHazardReportDto => ({
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
});

const warning = (id: string, status: WarningDto['status']) =>
  ({
    id,
    sourceReportId: 'r1',
    status,
    severity: 'HIGH',
    areaIds: [],
    createdBy: 'Officer',
    createdAt: '2026-10-08T05:00:00.000Z',
    publishedAt: null,
    updatedAt: null,
    cancelledAt: null,
  }) as unknown as WarningDto;

describe('buildReviewView', () => {
  const reports = [report('r1'), report('r2')];
  const warnings = [warning('w2', 'CANCELLED'), warning('w1', 'DRAFT')];

  it('gathers the report, its warnings, same-day reports and timeline', () => {
    const view = buildReviewView('r1', { reports, warnings, areaNames: {} });

    expect(view?.report.id).toBe('r1');
    expect(view?.current?.id).toBe('w1');
    expect(view?.linked.map((w) => w.id)).toEqual(['w2', 'w1']);
    expect(view?.sameDay.map((r) => r.id)).toEqual(['r2']);
    expect(view?.timeline.map((event) => event.kind)).toContain('verified');
  });

  it('is null when there is no report, or it is not loaded yet', () => {
    expect(
      buildReviewView(null, { reports, warnings, areaNames: {} }),
    ).toBeNull();
    expect(
      buildReviewView('r9', { reports, warnings, areaNames: {} }),
    ).toBeNull();
  });
});
