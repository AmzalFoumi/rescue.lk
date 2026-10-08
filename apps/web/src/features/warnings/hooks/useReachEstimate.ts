import { useMemo } from 'react';
import type { ReachEstimateDto } from '@rescue-lk/shared';
import { api } from '@/lib/api';
import { useAsyncResource } from './useAsyncResource';

// Expected reach per channel for the selected areas; nothing while none are
// selected. Asks again only when the selection itself changes.
export function useReachEstimate(areaIds: readonly string[]) {
  const key = areaIds.join('\n');
  const load = useMemo(() => {
    const ids = key ? key.split('\n') : [];
    return ids.length ? () => api.warnings.reach(ids) : null;
  }, [key]);
  return useAsyncResource<ReachEstimateDto>(load);
}
