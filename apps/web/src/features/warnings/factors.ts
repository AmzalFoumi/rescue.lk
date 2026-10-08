import type {
  TargetAreaDto,
  VerifiedHazardReportDto,
  WarningDto,
} from '@rescue-lk/shared';
import { shortId } from './format';
import { SEVERITY_META } from './meta';
import { resolveDistricts } from './monitoring';
import { sameDayReports } from './timeline';

interface FactorData {
  reports: readonly VerifiedHazardReportDto[];
  warnings: readonly WarningDto[];
  areas: readonly TargetAreaDto[];
}

export interface HazardFactors {
  district: string;
  sameDay: { count: number; ids: string };
  activeWarnings: { count: number; list: string };
}

// Step 3 "Hazard factors" that UC1 can work out itself about the report's
// district. Factors owned by other use cases are shown as not connected.
export const hazardFactors = (
  report: VerifiedHazardReportDto,
  { reports, warnings, areas }: FactorData,
): HazardFactors => {
  const district = report.districtName;
  const nearby = sameDayReports(report, reports);
  const covering = warnings.filter(
    (warning) =>
      warning.status === 'ACTIVE' &&
      resolveDistricts(warning.areaIds, areas).includes(district),
  );
  return {
    district,
    sameDay: {
      count: nearby.length,
      ids: nearby.map((other) => shortId('R', other.id)).join(', ') || 'None',
    },
    activeWarnings: {
      count: covering.length,
      list:
        covering
          .map(
            (warning) =>
              `${shortId('W', warning.id)} ${SEVERITY_META[warning.severity].label}`,
          )
          .join(', ') || 'None',
    },
  };
};
