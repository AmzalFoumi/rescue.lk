import type { HazardType } from './hazard-type.js';
import type { ReporterRole } from './reporter-role.js';

/**
 * What a reporter sends when submitting a hazard report.
 * A plain type, so the services and the offline queue do not depend on the
 * web layer's request class.
 */
export interface ReportSubmission {
  hazardType: HazardType;
  description: string;
  photoUrl?: string;
  latitude: number;
  longitude: number;
  /** District id. */
  district: string;
  /** When the report was captured, as an ISO date string. */
  capturedAt: string;
  reporterId: string;
  reporterRole: ReporterRole;
}
