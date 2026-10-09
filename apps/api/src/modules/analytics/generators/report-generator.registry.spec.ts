import { describe, it, expect } from 'vitest';
import { ReportGeneratorRegistry } from './report-generator.registry.js';
import type { ReportGenerator } from './report-generator.interface.js';
import { UnsupportedReportTypeException } from '../exceptions/unsupported-report-type.exception.js';
import type { ReportType } from '@rescue-lk/shared/analytics/report.types';

describe('ReportGeneratorRegistry', () => {
  it('returns correct instance', () => {
    const gen1 = { type: 'ALERT_TIMELINE' as ReportType } as ReportGenerator;
    const gen2 = { type: 'CITIZENS_REACHED' as ReportType } as ReportGenerator;
    const registry = new ReportGeneratorRegistry([gen1, gen2]);

    expect(registry.get('ALERT_TIMELINE')).toBe(gen1);
    expect(registry.get('CITIZENS_REACHED')).toBe(gen2);
  });

  it('throws UnsupportedReportTypeException on unknown key', () => {
    const registry = new ReportGeneratorRegistry([]);
    expect(() => registry.get('ALERT_TIMELINE')).toThrow(
      UnsupportedReportTypeException,
    );
    expect(() => registry.get('ALERT_TIMELINE')).toThrow(
      'Unsupported report type: ALERT_TIMELINE',
    );
  });

  it('throws with empty list', () => {
    const registry = new ReportGeneratorRegistry([]);
    expect(() => registry.get('SHELTER_OCCUPANCY')).toThrow(
      UnsupportedReportTypeException,
    );
  });
});
