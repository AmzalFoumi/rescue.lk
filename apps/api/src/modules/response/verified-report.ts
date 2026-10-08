import type { Location } from './location.js';

/**
 * A verified hazard report, as response coordination needs to see it. This is
 * our own small view of something another module owns: we read it, never write
 * it, so a change there only affects the adapter behind VERIFIED_REPORTS.
 */
export interface VerifiedReportSummary {
  id: string;
  hazardType: string;
  description: string;
  /** District id. */
  district: string;
  location: Location;
  capturedAt: Date;
}

/** A verified report with how many teams are already working on it. */
export interface ResponseTarget extends VerifiedReportSummary {
  dispatchedTeams: number;
  /** True while no team has been dispatched yet. */
  needsResponse: boolean;
}
