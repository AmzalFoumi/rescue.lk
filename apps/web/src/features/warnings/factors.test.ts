import { describe, it, expect } from 'vitest';
import type {
  TargetAreaDto,
  VerifiedHazardReportDto,
  WarningDto,
} from '@rescue-lk/shared';
import { hazardFactors } from './factors';

const areas: TargetAreaDto[] = [
  {
    id: 'D-RATNAPURA',
    kind: 'DISTRICT',
    name: 'Ratnapura District',
    districts: ['Ratnapura'],
  },
  {
    id: 'B-KALU',
    kind: 'RIVER_BASIN',
    name: 'Kalu Ganga basin',
    districts: ['Ratnapura', 'Kalutara'],
  },
];

const report = (id: string, districtName = 'Ratnapura') =>
  ({
    id,
    districtName,
    submittedAt: '2026-10-08T03:55:00.000Z',
  }) as VerifiedHazardReportDto;

const warning = (id: string, overrides: Partial<WarningDto>) =>
  ({
    id,
    status: 'ACTIVE',
    severity: 'HIGH',
    areaIds: ['B-KALU'],
    ...overrides,
  }) as WarningDto;

describe('hazardFactors', () => {
  it('counts what UC1 knows about the report district', () => {
    const subject = report('665f1b2c9d3e4a00000000a1');
    const factors = hazardFactors(subject, {
      reports: [
        subject,
        report('665f1b2c9d3e4a00000000a2'),
        report('x', 'Badulla'),
      ],
      warnings: [
        warning('665f1b2c9d3e4a0012345670', { severity: 'CRITICAL' }),
        warning('w2', { status: 'DRAFT' }),
        warning('w3', { areaIds: ['D-BADULLA'] }),
      ],
      areas,
    });

    expect(factors).toEqual({
      district: 'Ratnapura',
      sameDay: { count: 1, ids: 'R-0000A2' },
      activeWarnings: { count: 1, list: 'W-345670 Critical' },
    });
  });

  it('says None when nothing else is known', () => {
    const subject = report('r1');

    expect(
      hazardFactors(subject, { reports: [subject], warnings: [], areas }),
    ).toEqual({
      district: 'Ratnapura',
      sameDay: { count: 0, ids: 'None' },
      activeWarnings: { count: 0, list: 'None' },
    });
  });
});
