import type { TabularReportData } from '@rescue-lk/shared/analytics/report.types';

// What a generator produces. The service adds type, filters and generatedAt.
export type ReportContent = Pick<
  TabularReportData,
  'title' | 'description' | 'columns' | 'rows'
>;
