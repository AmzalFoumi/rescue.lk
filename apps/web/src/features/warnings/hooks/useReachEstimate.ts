import { useMemo } from 'react';
import type { ReachEstimateDto } from '@rescue-lk/shared';
import { api } from '@/lib/api';
import { useAsyncResource } from './useAsyncResource';
import { useStableIds } from './useStableIds';

// useReachEstimate loads the expected reach of each channel for the selected areas,
// and loads nothing while none are selected.
// DRY: built on useAsyncResource and useStableIds, so it asks the API again only when
// the selection really changes, not on every render.
export function useReachEstimate(areaIds: readonly string[]) {
  const ids = useStableIds(areaIds);
  const load = useMemo(
    () => (ids.length ? () => api.warnings.reach(ids) : null),
    [ids],
  );
  return useAsyncResource<ReachEstimateDto>(load);
}
