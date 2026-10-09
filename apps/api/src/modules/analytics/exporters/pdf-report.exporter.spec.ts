import { describe, it, expect } from 'vitest';
import { PdfReportExporter } from './pdf-report.exporter.js';
import type { TabularReportData } from '@rescue-lk/shared/analytics/report.types';

describe('PdfReportExporter', () => {
  const exporter = new PdfReportExporter();

  const baseReport: TabularReportData = {
    type: 'ALERT_TIMELINE',
    title: 'Test Title',
    description: 'Test Desc',
    generatedAt: '2026-10-01T12:00:00Z',
    filters: { from: '2026-10-01T00:00:00Z', to: '2026-10-02T00:00:00Z' },
    columns: [{ key: 'c1', label: 'Col 1' }],
    rows: [{ c1: 'Val 1' }],
  };

  it('generates a PDF buffer starting with %PDF', async () => {
    const buffer = await exporter.export(baseReport);
    expect(buffer.slice(0, 4).toString('utf-8')).toBe('%PDF');
  });

  it('handles empty rows', async () => {
    const report = { ...baseReport, rows: [] };
    const buffer = await exporter.export(report);
    expect(buffer.slice(0, 4).toString('utf-8')).toBe('%PDF');
  });

  it('handles more than 5 columns (landscape)', async () => {
    const report: TabularReportData = {
      ...baseReport,
      columns: [
        { key: 'c1', label: '1' },
        { key: 'c2', label: '2' },
        { key: 'c3', label: '3' },
        { key: 'c4', label: '4' },
        { key: 'c5', label: '5' },
        { key: 'c6', label: '6' },
      ],
      rows: [{ c1: '1', c2: '2', c3: '3', c4: '4', c5: '5', c6: '6' }],
    };
    const buffer = await exporter.export(report);
    expect(buffer.slice(0, 4).toString('utf-8')).toBe('%PDF');
  });
});
