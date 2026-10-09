import { describe, it, expect } from 'vitest';
import { CsvReportExporter } from './csv-report.exporter.js';
import type { TabularReportData } from '@rescue-lk/shared/analytics/report.types';

describe('CsvReportExporter', () => {
  const exporter = new CsvReportExporter();

  it('exports with label headers and handles null/missing cells', async () => {
    const report: TabularReportData = {
      type: 'ALERT_TIMELINE',
      title: 'T',
      description: 'D',
      generatedAt: 'G',
      filters: { from: '2026-10-01', to: '2026-10-02' },
      columns: [
        { key: 'col1', label: 'Column 1' },
        { key: 'col2', label: 'Column 2' },
      ],
      rows: [
        { col1: 'val1', col2: 'val2' },
        { col1: 'val3' }, // Missing col2 should be empty
        { col1: null, col2: 'val4' }, // Null should be empty
      ],
    };

    const buffer = await exporter.export(report);
    const csv = buffer.toString('utf-8');

    expect(csv).toContain('Column 1,Column 2');
    expect(csv).toContain('val1,val2');
    expect(csv).toContain('val3,');
    expect(csv).toContain(',val4');
  });

  it('handles commas, quotes, and newlines in data by escaping', async () => {
    const report: TabularReportData = {
      type: 'ALERT_TIMELINE',
      title: 'T',
      description: 'D',
      generatedAt: 'G',
      filters: { from: '2026-10-01', to: '2026-10-02' },
      columns: [{ key: 'data', label: 'Data' }],
      rows: [
        { data: 'hello, world' },
        { data: 'hello "world"' },
        { data: 'hello\nworld' },
      ],
    };
    const buffer = await exporter.export(report);
    const csv = buffer.toString('utf-8');

    expect(csv).toContain('"hello, world"');
    expect(csv).toContain('"hello ""world"""');
    expect(csv).toContain('"hello\nworld"');
  });

  it('handles empty rows', async () => {
    const report: TabularReportData = {
      type: 'ALERT_TIMELINE',
      title: 'T',
      description: 'D',
      generatedAt: 'G',
      filters: { from: '2026-10-01', to: '2026-10-02' },
      columns: [{ key: 'col', label: 'Col' }],
      rows: [],
    };
    const buffer = await exporter.export(report);
    const csv = buffer.toString('utf-8');

    expect(csv.trim()).toBe('Col'); // Only header
  });
});
