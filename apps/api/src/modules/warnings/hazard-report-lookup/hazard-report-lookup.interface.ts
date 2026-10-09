import type {
  HazardReportStatus,
  VerifiedHazardReportDto,
} from '@rescue-lk/shared';

// DI token for the HazardReportLookup port.
export const HAZARD_REPORT_LOOKUP = Symbol('HAZARD_REPORT_LOOKUP');

// A report in any status, so step 8.2 can reject ones that are not verified.
// Only a verified report has verification details.
export type HazardReportSummary = Omit<
  VerifiedHazardReportDto,
  'status' | 'verifiedAt' | 'verifiedBy'
> & {
  status: HazardReportStatus;
  verifiedAt: string | null;
  verifiedBy: string | null;
};

// HazardReportLookup is how UC1 reads hazard reports, which belong to UC2.
// Port (ports and adapters) + DIP: UC1 depends only on this interface, never on UC2
// code, so the two use cases can be built and tested separately.
// MongooseHazardReportLookup implements it by reading UC2's reports; a fake can
// replace it in tests, and only the binding in warnings.module.ts changes.
// Sequence diagram: the HazardReport lifeline.
export interface HazardReportLookup {
  // Sequence diagram: HazardReport.getStatus() for the selected report.
  findById(id: string): Promise<HazardReportSummary | null>;
  // Feeds the report picker: only verified reports can be warned about.
  findVerified(): Promise<VerifiedHazardReportDto[]>;
}
