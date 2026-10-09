import { describe, it, expect } from 'vitest';
import type {
  TargetAreaDto,
  VerifiedHazardReportDto,
  WarningDto,
} from '@rescue-lk/shared';
import {
  EMPTY_FILTERS,
  currentWarningFor,
  districtAreaId,
  districtsUnderWarning,
  filterReports,
  linkedWarnings,
  monitorSummary,
  resolveDistricts,
} from './monitoring';

const areas: TargetAreaDto[] = [
  {
    id: 'D-RATNAPURA',
    kind: 'DISTRICT',
    name: 'Ratnapura District',
    districts: ['Ratnapura'],
  },
  {
    id: 'D-BADULLA',
    kind: 'DISTRICT',
    name: 'Badulla District',
    districts: ['Badulla'],
  },
  {
    id: 'D-KALUTARA',
    kind: 'DISTRICT',
    name: 'Kalutara District',
    districts: ['Kalutara'],
  },
  {
    id: 'B-KALU',
    kind: 'RIVER_BASIN',
    name: 'Kalu Ganga basin',
    districts: ['Ratnapura', 'Kalutara'],
  },
];

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

const warning = (
  id: string,
  overrides: Partial<WarningDto> = {},
): WarningDto => ({
  id,
  sourceReportId: 'r1',
  hazard: 'FLOOD',
  otherHazard: '',
  severity: 'HIGH',
  areaIds: ['D-RATNAPURA'],
  message: 'The Kalu Ganga is rising quickly.',
  instructions: 'Move to higher ground.',
  channels: ['SMS'],
  status: 'ACTIVE',
  version: 1,
  createdBy: 'Officer',
  createdAt: '2026-10-08T05:00:00.000Z',
  publishedAt: '2026-10-08T05:00:00.000Z',
  updatedAt: null,
  cancelledAt: null,
  cancelReason: '',
  ...overrides,
});

describe('warnings of a report', () => {
  // The API lists warnings newest first.
  const warnings = [
    warning('w3', { sourceReportId: 'r1', status: 'CANCELLED' }),
    warning('w2', { sourceReportId: 'r1', status: 'DRAFT' }),
    warning('w1', { sourceReportId: 'r1', status: 'ACTIVE' }),
    warning('w0', { sourceReportId: 'r2' }),
  ];

  it('linkedWarnings keeps every warning of the report, newest first', () => {
    expect(linkedWarnings('r1', warnings).map((w) => w.id)).toEqual([
      'w3',
      'w2',
      'w1',
    ]);
  });

  it('currentWarningFor is the newest warning that is not cancelled', () => {
    expect(currentWarningFor('r1', warnings)?.id).toBe('w2');
    expect(currentWarningFor('r9', warnings)).toBeUndefined();
  });
});

describe('areas', () => {
  it('resolveDistricts expands basins into distinct districts', () => {
    expect(resolveDistricts(['B-KALU', 'D-RATNAPURA', 'X'], areas)).toEqual([
      'Ratnapura',
      'Kalutara',
    ]);
  });

  it('districtAreaId finds the area id of a district', () => {
    expect(districtAreaId('Badulla', areas)).toBe('D-BADULLA');
    expect(districtAreaId('Atlantis', areas)).toBeUndefined();
  });
});

describe('filterReports', () => {
  const reports = [
    report('r1', { place: 'Ratnapura town', districtName: 'Ratnapura' }),
    report('r2', {
      hazardType: 'LANDSLIDE',
      place: 'Haldummulla',
      districtName: 'Badulla',
    }),
    report('r3', {
      hazardType: 'FIRE',
      place: 'Mihintale',
      districtName: 'Anuradhapura',
    }),
  ];
  const warnings = [
    warning('w1', {
      sourceReportId: 'r1',
      severity: 'CRITICAL',
      status: 'ACTIVE',
    }),
    warning('w2', { sourceReportId: 'r2', severity: 'LOW', status: 'DRAFT' }),
  ];
  const ids = (filters: Partial<typeof EMPTY_FILTERS>) =>
    filterReports(reports, warnings, { ...EMPTY_FILTERS, ...filters }).map(
      (row) => row.report.id,
    );

  it('pairs each report with its current warning', () => {
    expect(
      filterReports(reports, warnings, EMPTY_FILTERS).map(
        (row) => row.warning?.id,
      ),
    ).toEqual(['w1', 'w2', undefined]);
  });

  it('searches id, place, district and description, ignoring case', () => {
    expect(ids({ query: 'haldu' })).toEqual(['r2']);
    expect(ids({ query: 'ANURADHA' })).toEqual(['r3']);
    expect(ids({ query: 'r1' })).toEqual(['r1']);
  });

  it('filters by hazard, district and severity', () => {
    expect(ids({ hazard: 'LANDSLIDE' })).toEqual(['r2']);
    expect(ids({ district: 'Ratnapura' })).toEqual(['r1']);
    expect(ids({ severity: 'CRITICAL' })).toEqual(['r1']);
  });

  it('filters by warning status, including reports with no warning yet', () => {
    expect(ids({ warningStatus: 'NONE' })).toEqual(['r3']);
    expect(ids({ warningStatus: 'DRAFT' })).toEqual(['r2']);
    expect(ids({ warningStatus: 'ACTIVE' })).toEqual(['r1']);
  });
});

describe('districtsUnderWarning', () => {
  it('lists each district covered by an ACTIVE warning, most severe first', () => {
    const warnings = [
      warning('w1', { areaIds: ['D-BADULLA'], severity: 'MEDIUM' }),
      warning('w2', { areaIds: ['B-KALU'], severity: 'CRITICAL' }),
      warning('w3', { areaIds: ['D-RATNAPURA'], severity: 'LOW' }),
      warning('w4', {
        areaIds: ['D-BADULLA'],
        status: 'DRAFT',
        severity: 'CRITICAL',
      }),
    ];

    expect(districtsUnderWarning(warnings, areas)).toEqual([
      { district: 'Ratnapura', severity: 'CRITICAL', warningIds: ['w2', 'w3'] },
      { district: 'Kalutara', severity: 'CRITICAL', warningIds: ['w2'] },
      { district: 'Badulla', severity: 'MEDIUM', warningIds: ['w1'] },
    ]);
  });
});

describe('monitorSummary', () => {
  it('counts the KPI figures', () => {
    const reports = [report('r1'), report('r2'), report('r3')];
    const warnings = [
      warning('w1', { sourceReportId: 'r1', severity: 'CRITICAL' }),
      warning('w2', {
        sourceReportId: 'r2',
        severity: 'MEDIUM',
        areaIds: ['B-KALU'],
      }),
      warning('w3', { sourceReportId: 'r3', status: 'DRAFT' }),
      warning('w4', { sourceReportId: 'r3', status: 'CANCELLED' }),
    ];

    expect(monitorSummary(reports, warnings, areas)).toEqual({
      activeHazards: 3,
      withoutWarning: 0,
      activeWarnings: 2,
      criticalOrHigh: 1,
      drafts: 1,
      districts: ['Ratnapura', 'Kalutara'],
    });
  });
});
