import { useMemo } from 'react';
import type { DeliveryRecordDto } from '@rescue-lk/shared';
import { api } from '@/lib/api';
import { useAsyncResource } from './useAsyncResource';
import { useStableIds } from './useStableIds';

export type DeliveriesByWarning = Record<string, DeliveryRecordDto[]>;

// useDeliveriesByWarning loads the latest deliveries of several warnings at once, for
// the chips in the warning list.
// DRY: built on useAsyncResource and useStableIds, so it reloads only when the list of
// warnings really changes.
export function useDeliveriesByWarning(warningIds: readonly string[]) {
  const ids = useStableIds(warningIds);
  const load = useMemo(() => {
    if (!ids.length) {
      return null;
    }
    return async (): Promise<DeliveriesByWarning> => {
      const lists = await Promise.all(
        ids.map((warningId) => api.warnings.deliveries(warningId)),
      );
      return Object.fromEntries(
        ids.map((warningId, index) => [warningId, lists[index]]),
      );
    };
  }, [ids]);
  return useAsyncResource<DeliveriesByWarning>(load);
}
