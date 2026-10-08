import type { HazardReportStatus } from './hazard-report-status.js';
import type { HazardReportRecord } from './hazard-report-record.js';
import type { HazardType } from './hazard-type.js';
import type { Location } from './location.js';
import type { ReporterRole } from './reporter-role.js';

export const HAZARD_REPORTS_REPOSITORY = Symbol('HAZARD_REPORTS_REPOSITORY');

export interface NewHazardReport {
  hazardType: HazardType;
  description: string;
  photoUrl?: string;
  location: Location;
  district: string;
  capturedAt: Date;
  status: HazardReportStatus;
  possibleDuplicateOf: string[];
  reporterId: string;
  reporterRole: ReporterRole;
}

export interface StatusChange {
  status: HazardReportStatus;
  verifiedBy: string;
  verifiedAt: Date;
  rejectionReason?: string;
}

export interface HazardReportsRepository {
  create(report: NewHazardReport): Promise<HazardReportRecord>;
  findById(id: string): Promise<HazardReportRecord | null>;
  findByStatus(status: HazardReportStatus): Promise<HazardReportRecord[]>;
  // Reports of one hazard type captured between two dates (used by the duplicate check).
  findByTypeBetween(
    type: HazardType,
    from: Date,
    to: Date,
  ): Promise<HazardReportRecord[]>;
  updateStatus(
    id: string,
    change: StatusChange,
  ): Promise<HazardReportRecord | null>;
}
