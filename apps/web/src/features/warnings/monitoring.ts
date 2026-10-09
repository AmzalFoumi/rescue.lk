import type {
  HazardType,
  TargetAreaDto,
  VerifiedHazardReportDto,
  WarningDto,
  WarningSeverity,
} from '@rescue-lk/shared';
import { SEVERITIES } from './meta';

// monitoring.ts: the pure rules behind step 1 "Hazard monitoring": filtering reports,
// each report's current warning, KPIs and districts under warning.
// SRP: kept out of components and hooks, so they are unit tested without rendering.

export type WarningStatusFilter = 'ALL' | 'NONE' | 'DRAFT' | 'ACTIVE';

export interface MonitorFilters {
  query: string;
  hazard: HazardType | 'ALL';
  district: string;
  severity: WarningSeverity | 'ALL';
  warningStatus: WarningStatusFilter;
}

export const ALL = 'ALL';

export const EMPTY_FILTERS: MonitorFilters = {
  query: '',
  hazard: ALL,
  district: ALL,
  severity: ALL,
  warningStatus: ALL,
};

// Every warning based on a report, newest first (the API's order).
export const linkedWarnings = (
  reportId: string,
  warnings: readonly WarningDto[],
): WarningDto[] =>
  warnings.filter((warning) => warning.sourceReportId === reportId);

// The warning a report currently has: the newest one not cancelled.
export const currentWarningFor = (
  reportId: string,
  warnings: readonly WarningDto[],
): WarningDto | undefined =>
  linkedWarnings(reportId, warnings).find(
    (warning) => warning.status !== 'CANCELLED',
  );

export const resolveDistricts = (
  areaIds: readonly string[],
  areas: readonly TargetAreaDto[],
): string[] => {
  const byId = new Map(areas.map((area) => [area.id, area]));
  return [...new Set(areaIds.flatMap((id) => byId.get(id)?.districts ?? []))];
};

export const districtAreaId = (
  districtName: string,
  areas: readonly TargetAreaDto[],
): string | undefined =>
  areas.find(
    (area) => area.kind === 'DISTRICT' && area.districts[0] === districtName,
  )?.id;

export interface ReportRow {
  report: VerifiedHazardReportDto;
  warning: WarningDto | undefined;
}

const matchesQuery = (report: VerifiedHazardReportDto, query: string) => {
  const needle = query.trim().toLowerCase();
  return (
    !needle ||
    [report.id, report.place, report.districtName, report.description]
      .join(' ')
      .toLowerCase()
      .includes(needle)
  );
};

const matchesWarningStatus = (
  warning: WarningDto | undefined,
  filter: WarningStatusFilter,
) => {
  if (filter === ALL) {
    return true;
  }
  return filter === 'NONE' ? !warning : warning?.status === filter;
};

export const filterReports = (
  reports: readonly VerifiedHazardReportDto[],
  warnings: readonly WarningDto[],
  filters: MonitorFilters,
): ReportRow[] =>
  reports
    .map((report) => ({
      report,
      warning: currentWarningFor(report.id, warnings),
    }))
    .filter(
      ({ report, warning }) =>
        matchesQuery(report, filters.query) &&
        (filters.hazard === ALL || report.hazardType === filters.hazard) &&
        (filters.district === ALL ||
          report.districtName === filters.district) &&
        (filters.severity === ALL || warning?.severity === filters.severity) &&
        matchesWarningStatus(warning, filters.warningStatus),
    );

export interface DistrictUnderWarning {
  district: string;
  // The most severe active warning covering the district.
  severity: WarningSeverity;
  warningIds: string[];
}

const severityRank = (severity: WarningSeverity) =>
  SEVERITIES.indexOf(severity);

export const districtsUnderWarning = (
  warnings: readonly WarningDto[],
  areas: readonly TargetAreaDto[],
): DistrictUnderWarning[] => {
  const byDistrict = new Map<string, DistrictUnderWarning>();
  for (const warning of warnings.filter((w) => w.status === 'ACTIVE')) {
    for (const district of resolveDistricts(warning.areaIds, areas)) {
      const entry = byDistrict.get(district);
      if (!entry) {
        byDistrict.set(district, {
          district,
          severity: warning.severity,
          warningIds: [warning.id],
        });
        continue;
      }
      entry.warningIds.push(warning.id);
      if (severityRank(warning.severity) < severityRank(entry.severity)) {
        entry.severity = warning.severity;
      }
    }
  }
  return [...byDistrict.values()].sort(
    (a, b) => severityRank(a.severity) - severityRank(b.severity),
  );
};

export interface MonitorSummary {
  activeHazards: number;
  withoutWarning: number;
  activeWarnings: number;
  criticalOrHigh: number;
  drafts: number;
  districts: string[];
}

const URGENT: readonly WarningSeverity[] = ['CRITICAL', 'HIGH'];

export const monitorSummary = (
  reports: readonly VerifiedHazardReportDto[],
  warnings: readonly WarningDto[],
  areas: readonly TargetAreaDto[],
): MonitorSummary => {
  const active = warnings.filter((warning) => warning.status === 'ACTIVE');
  return {
    activeHazards: reports.length,
    withoutWarning: reports.filter(
      (report) => !currentWarningFor(report.id, warnings),
    ).length,
    activeWarnings: active.length,
    criticalOrHigh: active.filter((warning) =>
      URGENT.includes(warning.severity),
    ).length,
    drafts: warnings.filter((warning) => warning.status === 'DRAFT').length,
    districts: districtsUnderWarning(warnings, areas).map(
      (entry) => entry.district,
    ),
  };
};
