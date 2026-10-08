import type {
  HazardReportStatus,
  VerifiedHazardReportDto,
} from '@rescue-lk/shared';

// Port (ports and adapters): UC1 reads hazard reports through this interface only,
// so it never depends on UC2 (hazard-reports module) code.
export const HAZARD_REPORT_LOOKUP = Symbol('HAZARD_REPORT_LOOKUP');

// A report in any status, so step 8.2 can reject ones that are not verified.
export type HazardReportSummary = Omit<VerifiedHazardReportDto, 'status'> & {
  status: HazardReportStatus;
};

export interface HazardReportLookup {
  // Sequence diagram: HazardReport.getStatus() for the selected report.
  findById(id: string): Promise<HazardReportSummary | null>;
  // Feeds the report picker: only verified reports can be warned about.
  findVerified(): Promise<VerifiedHazardReportDto[]>;
}
