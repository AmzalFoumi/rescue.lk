import type { HazardReportStatus } from './hazard-report-status.js';
import type { HazardType, ReporterRole } from './hazard-type.js';
import type { HazardReportDocument } from './schemas/hazard-report.schema.js';

export const HAZARD_REPORTS_REPOSITORY = Symbol('HAZARD_REPORTS_REPOSITORY');

export interface NewHazardReport {
  hazardType: HazardType;
  description: string;
  photoUrl?: string;
  latitude: number;
  longitude: number;
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
  create(report: NewHazardReport): Promise<HazardReportDocument>;
  findById(id: string): Promise<HazardReportDocument | null>;
  findByStatus(status: HazardReportStatus): Promise<HazardReportDocument[]>;
  // Reports of one hazard type captured between two dates (used by the duplicate check).
  findByTypeBetween(
    type: HazardType,
    from: Date,
    to: Date,
  ): Promise<HazardReportDocument[]>;
  updateStatus(
    id: string,
    change: StatusChange,
  ): Promise<HazardReportDocument | null>;
}
