import type {
  ExportFormat,
  TabularReportData,
} from '@rescue-lk/shared/analytics/report.types';

export const REPORT_EXPORTERS = Symbol('REPORT_EXPORTERS');

export interface ReportExporter {
  readonly format: ExportFormat;
  readonly contentType: string;
  readonly fileExtension: string;
  export(report: TabularReportData): Promise<Buffer>;
}
