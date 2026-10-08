import type { HazardReportStatus } from './hazard-report-status.js';
import type { HazardType } from './hazard-type.js';
import type { ReporterRole } from './reporter-role.js';

/**
 * A stored hazard report, as the services see it.
 * A plain type: it does not know about MongoDB. Only the Mongoose repository
 * converts database documents into this shape.
 */
export interface HazardReportRecord {
  id: string;
  hazardType: HazardType;
  description: string;
  photoUrl?: string;
  latitude: number;
  longitude: number;
  /** District id. */
  district: string;
  capturedAt: Date;
  /** When the server stored the report (submittedAt in the class diagram). */
  submittedAt: Date;
  status: HazardReportStatus;
  /** Ids of earlier reports that look like the same event. */
  possibleDuplicateOf: string[];
  reporterId: string;
  reporterRole: ReporterRole;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
}
