import type { VerifiedReportSummary } from './verified-report.js';

export const VERIFIED_REPORTS = Symbol('VERIFIED_REPORTS');

/**
 * The one way response coordination reads hazard reports. Hazard reporting
 * owns that data; we only ever read the verified ones, through this port, so
 * no service here depends on another module's classes.
 */
export interface VerifiedReportsPort {
  findVerified(): Promise<VerifiedReportSummary[]>;
  findVerifiedById(id: string): Promise<VerifiedReportSummary | null>;
}
