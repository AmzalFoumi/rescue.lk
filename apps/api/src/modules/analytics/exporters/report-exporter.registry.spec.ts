import { describe, it, expect } from 'vitest';
import { ReportExporterRegistry } from './report-exporter.registry.js';
import type { ReportExporter } from './report-exporter.interface.js';
import { UnsupportedExportFormatException } from '../exceptions/unsupported-export-format.exception.js';
import type { ExportFormat } from '@rescue-lk/shared/analytics/report.types';

describe('ReportExporterRegistry', () => {
  it('returns correct instance', () => {
    const exp1 = { format: 'CSV' as ExportFormat } as ReportExporter;
    const exp2 = { format: 'PDF' as ExportFormat } as ReportExporter;
    const registry = new ReportExporterRegistry([exp1, exp2]);

    expect(registry.get('CSV')).toBe(exp1);
    expect(registry.get('PDF')).toBe(exp2);
  });

  it('throws UnsupportedExportFormatException on unknown key', () => {
    const registry = new ReportExporterRegistry([]);
    expect(() => registry.get('CSV')).toThrow(UnsupportedExportFormatException);
    expect(() => registry.get('CSV')).toThrow('Unsupported export format: CSV');
  });

  it('throws with empty list', () => {
    const registry = new ReportExporterRegistry([]);
    expect(() => registry.get('PDF')).toThrow(UnsupportedExportFormatException);
  });
});
