'use client';

import { useCallback, useMemo } from 'react';
import type { DistrictDto, HazardReportDto } from '@rescue-lk/shared';
import { useDistrictsApi, useHazardReportsApi } from '../api/api-context';
import { useReporting } from '../state/reporting-context';
import { useAsyncData, type AsyncData } from './use-async-data';

/** The districts for the form's dropdown and for place names. */
export function useDistricts(): AsyncData<DistrictDto[]> {
  const api = useDistrictsApi();
  return useAsyncData(useCallback(() => api.list(), [api]));
}

/** The citizen's own reports from the server. Loads again when a sync finishes. */
export function useMyReports(): AsyncData<HazardReportDto[]> {
  const api = useHazardReportsApi();
  const { reporter, queue } = useReporting();
  const load = useCallback(
    () => api.listByReporter(reporter.id),
    [api, reporter.id],
  );
  // A finished sync changes the reports, so the sync state is the refresh key.
  return useAsyncData(load, queue.syncState);
}

/** The operator's list: reports waiting for verification, oldest first. */
export function usePendingReports(): AsyncData<HazardReportDto[]> {
  const api = useHazardReportsApi();
  return useAsyncData(useCallback(() => api.listPending(), [api]));
}

/** The earlier reports that look like the same event, fetched one by one. */
export function useDuplicateReports(
  ids: readonly string[],
): AsyncData<HazardReportDto[]> {
  const api = useHazardReportsApi();
  const key = ids.join(',');
  const stableIds = useMemo(() => (key === '' ? [] : key.split(',')), [key]);
  return useAsyncData(
    useCallback(
      () => Promise.all(stableIds.map((id) => api.getById(id))),
      [api, stableIds],
    ),
  );
}
