import { useMemo, useState } from 'react';
import type {
  TargetAreaDto,
  VerifiedHazardReportDto,
  WarningDto,
  WarningStatus,
} from '@rescue-lk/shared';
import {
  EMPTY_FILTERS,
  districtsUnderWarning,
  filterReports,
  monitorSummary,
  type MonitorFilters,
} from '../monitoring';
import { WARNING_STATUSES } from '../meta';
import { useDeliveriesByWarning } from './useDeliveriesByWarning';

interface MonitorData {
  reports: readonly VerifiedHazardReportDto[];
  warnings: readonly WarningDto[];
  areas: readonly TargetAreaDto[];
}

const DEFAULT_TAB: WarningStatus = 'ACTIVE';

// State and derived figures of the "Hazard monitoring" step.
export function useMonitorScreen({ reports, warnings, areas }: MonitorData) {
  const [filters, setFilters] = useState<MonitorFilters>(EMPTY_FILTERS);
  const [tab, setTab] = useState<WarningStatus>(DEFAULT_TAB);

  const rows = useMemo(
    () => filterReports(reports, warnings, filters),
    [reports, warnings, filters],
  );
  const summary = useMemo(
    () => monitorSummary(reports, warnings, areas),
    [reports, warnings, areas],
  );
  const districts = useMemo(
    () => districtsUnderWarning(warnings, areas),
    [warnings, areas],
  );
  const districtOptions = useMemo(
    () =>
      areas
        .filter((area) => area.kind === 'DISTRICT')
        .map((area) => area.districts[0])
        .sort(),
    [areas],
  );
  const counts = useMemo(
    () =>
      Object.fromEntries(
        WARNING_STATUSES.map((status) => [
          status,
          warnings.filter((warning) => warning.status === status).length,
        ]),
      ) as Record<WarningStatus, number>,
    [warnings],
  );
  const tabWarnings = useMemo(
    () => warnings.filter((warning) => warning.status === tab),
    [warnings, tab],
  );
  const deliveries = useDeliveriesByWarning(
    tabWarnings.map((warning) => warning.id),
  );

  return {
    filters,
    changeFilters: (change: Partial<MonitorFilters>) =>
      setFilters((current) => ({ ...current, ...change })),
    resetFilters: () => setFilters(EMPTY_FILTERS),
    rows,
    total: reports.length,
    summary,
    districts,
    districtOptions,
    tab,
    setTab,
    counts,
    tabWarnings,
    deliveries: deliveries.data,
  };
}
