import { Injectable } from '@nestjs/common';
import { stringify } from 'csv-stringify/sync';
import type { TabularReportData } from '@rescue-lk/shared/analytics/report.types';
import type { ReportExporter } from './report-exporter.interface.js';

@Injectable()
export class CsvReportExporter implements ReportExporter {
  readonly format = 'CSV' as const;
  readonly contentType = 'text/csv; charset=utf-8';
  readonly fileExtension = 'csv';

  async export(report: TabularReportData): Promise<Buffer> {
    const headers = report.columns.map((c) => c.label);
    const rows = report.rows.map((row) =>
      report.columns.map((c) => row[c.key] ?? ''),
    );
    return Buffer.from(stringify([headers, ...rows]), 'utf-8');
  }
}
