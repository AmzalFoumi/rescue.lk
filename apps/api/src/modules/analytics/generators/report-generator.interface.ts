import type { ReportType } from '@rescue-lk/shared/analytics/report.types';
import type { AnalyticsFilters } from '../domain/analytics-filters.js';
import type { ReportContent } from '../domain/report-content.js';

export const REPORT_GENERATORS = Symbol('REPORT_GENERATORS');

export interface ReportGenerator {
  readonly type: ReportType;
  generate(filters: AnalyticsFilters): Promise<ReportContent>;
}
