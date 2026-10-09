export type ReportType =
  | 'ALERT_TIMELINE'
  | 'CITIZENS_REACHED'
  | 'SHELTER_OCCUPANCY'
  | 'RESOURCE_DISTRIBUTION';

export type ExportFormat = 'PDF' | 'CSV';

export type DemoRole = 'DMC_ADMIN' | 'DONOR_ORGANISATION';

export type ReportCell = string | number | null;

export interface ReportColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
}

export interface TabularReportData {
  type: ReportType;
  title: string;
  description: string;
  generatedAt: string; // ISO
  filters: {
    from: string; // ISO
    to: string; // ISO
    hazardType?: string;
    district?: string;
  };
  columns: ReportColumn[];
  rows: Record<string, ReportCell>[];
}
