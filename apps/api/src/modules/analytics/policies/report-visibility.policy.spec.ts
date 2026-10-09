import { describe, it, expect } from 'vitest';
import { ReportVisibilityPolicy } from './report-visibility.policy.js';
import { ForbiddenException } from '@nestjs/common';
import type {
  DemoRole,
  ReportType,
} from '@rescue-lk/shared/analytics/report.types';

describe('ReportVisibilityPolicy', () => {
  const policy = new ReportVisibilityPolicy();

  it('DMC_ADMIN sees 4 reports', () => {
    const visible = policy.getVisibleReportTypes('DMC_ADMIN');
    expect(visible).toHaveLength(4);
    expect(visible).toContain('ALERT_TIMELINE');
    expect(visible).toContain('CITIZENS_REACHED');
    expect(visible).toContain('SHELTER_OCCUPANCY');
    expect(visible).toContain('RESOURCE_DISTRIBUTION');
  });

  it('DONOR_ORGANISATION sees 2 reports', () => {
    const visible = policy.getVisibleReportTypes('DONOR_ORGANISATION');
    expect(visible).toHaveLength(2);
    expect(visible).toContain('CITIZENS_REACHED');
    expect(visible).toContain('RESOURCE_DISTRIBUTION');
  });

  it('assertCanViewReport passes for allowed', () => {
    expect(() =>
      policy.assertCanViewReport('DMC_ADMIN', 'ALERT_TIMELINE'),
    ).not.toThrow();
    expect(() =>
      policy.assertCanViewReport('DONOR_ORGANISATION', 'CITIZENS_REACHED'),
    ).not.toThrow();
  });

  it.each([
    {
      role: 'DONOR_ORGANISATION' as DemoRole,
      type: 'ALERT_TIMELINE' as ReportType,
    },
    {
      role: 'DONOR_ORGANISATION' as DemoRole,
      type: 'SHELTER_OCCUPANCY' as ReportType,
    },
  ])(
    'assertCanViewReport throws ForbiddenException for $type with $role',
    ({ role, type }) => {
      expect(() => policy.assertCanViewReport(role, type)).toThrow(
        ForbiddenException,
      );
    },
  );
});
