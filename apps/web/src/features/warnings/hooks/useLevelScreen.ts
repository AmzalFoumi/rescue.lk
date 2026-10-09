import { useMemo } from 'react';
import type {
  TargetAreaDto,
  VerifiedHazardReportDto,
  WarningDto,
} from '@rescue-lk/shared';
import { hazardFactors } from '../factors';
import { districtAreaId } from '../monitoring';
import { reachFor } from '../publishing';
import { useReachEstimate } from './useReachEstimate';

interface LevelScreenData {
  sourceReportId: string;
  reports: readonly VerifiedHazardReportDto[];
  warnings: readonly WarningDto[];
  areas: readonly TargetAreaDto[];
}

// useLevelScreen gathers the data step 3 shows: the chosen source report, what is
// known about its district, and how many phones SMS reaches there.
// SRP: data only; choices made on the step go through the form hook.
export function useLevelScreen({
  sourceReportId,
  reports,
  warnings,
  areas,
}: LevelScreenData) {
  const sourceReport = reports.find((report) => report.id === sourceReportId);
  const factors = useMemo(
    () =>
      sourceReport
        ? hazardFactors(sourceReport, { reports, warnings, areas })
        : null,
    [sourceReport, reports, warnings, areas],
  );
  const sourceAreaId =
    sourceReport && districtAreaId(sourceReport.districtName, areas);
  const districtReach = useReachEstimate(sourceAreaId ? [sourceAreaId] : []);

  return {
    sourceReport,
    factors,
    smsReach: reachFor(districtReach.data, 'SMS'),
  };
}
