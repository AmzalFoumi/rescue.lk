import type {
  HazardReportStatus,
  HazardType,
  VerifiedHazardReportDto,
} from '@rescue-lk/shared';
import { UNKNOWN_DISTRICT_NAME } from '../warnings.constants.js';
import type { HazardReportSummary } from './hazard-report-lookup.interface.js';

// A hazard report as UC1 needs it from storage, in plain types.
// SRP: this file only turns that shape into UC1's own view. It knows nothing about
// Mongoose, so the rules below are tested without a database.
export interface StoredHazardReport {
  id: string;
  hazardType: HazardType;
  description: string;
  placeName?: string;
  reporterName?: string;
  reporterId: string;
  district: string;
  status: HazardReportStatus;
  capturedAt: Date;
  createdAt?: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
}

// Optional fields in UC2 are required in the UC1 view, so each one has a fallback
// that still reads sensibly on screen.
export function toHazardReportSummary(
  report: StoredHazardReport,
  districtName?: string,
): HazardReportSummary {
  const district = districtName ?? UNKNOWN_DISTRICT_NAME;
  return {
    id: report.id,
    hazardType: report.hazardType,
    district: report.district,
    districtName: district,
    place: report.placeName?.trim() || district,
    reporter: report.reporterName?.trim() || report.reporterId,
    status: report.status,
    description: report.description,
    submittedAt: (report.createdAt ?? report.capturedAt).toISOString(),
    verifiedAt: report.verifiedAt?.toISOString() ?? null,
    verifiedBy: report.verifiedBy ?? null,
  };
}

// Only a verified report that says who verified it and when can be warned about.
export function toVerifiedReport(
  summary: HazardReportSummary,
): VerifiedHazardReportDto | null {
  if (
    summary.status !== 'verified' ||
    summary.verifiedAt === null ||
    summary.verifiedBy === null
  ) {
    return null;
  }
  return {
    ...summary,
    status: 'verified',
    verifiedAt: summary.verifiedAt,
    verifiedBy: summary.verifiedBy,
  };
}
