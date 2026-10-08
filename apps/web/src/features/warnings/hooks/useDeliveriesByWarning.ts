import { useMemo } from 'react';
import type { DeliveryRecordDto } from '@rescue-lk/shared';
import { api } from '@/lib/api';
import { useAsyncResource } from './useAsyncResource';

export type DeliveriesByWarning = Record<string, DeliveryRecordDto[]>;

// Latest-version deliveries of several warnings at once, for the per-channel
// chips in the warning list. Fine for the handful of warnings a tab shows.
export function useDeliveriesByWarning(warningIds: readonly string[]) {
  const key = warningIds.join('\n');
  const load = useMemo(() => {
    const ids = key ? key.split('\n') : [];
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
  }, [key]);
  return useAsyncResource<DeliveriesByWarning>(load);
}
