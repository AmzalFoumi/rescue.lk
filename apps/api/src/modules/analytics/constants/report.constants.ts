import type {
  ExportFormat,
  ReportType,
} from '@rescue-lk/shared/analytics/report.types';

export const REPORT_TYPES = [
  'ALERT_TIMELINE',
  'CITIZENS_REACHED',
  'SHELTER_OCCUPANCY',
  'RESOURCE_DISTRIBUTION',
] as const satisfies readonly ReportType[];

export const EXPORT_FORMATS = [
  'PDF',
  'CSV',
] as const satisfies readonly ExportFormat[];
