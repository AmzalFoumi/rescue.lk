import { useEffect, useMemo } from 'react';
import type { DeliveryRecordDto } from '@rescue-lk/shared';
import { api } from '@/lib/api';
import {
  DELIVERY_POLL_INTERVAL_MS,
  IN_PROGRESS_DELIVERY_STATUSES,
} from '../constants';
import { useAsyncResource } from './useAsyncResource';

// useDeliveries loads the per-channel delivery status of a warning's current version.
// It keeps polling while any channel is QUEUED or RETRYING, then stops by itself, so
// step 5 updates live without wasting requests.
// DRY: built on useAsyncResource; the interval and the in-progress statuses are
// named constants (no magic numbers).
export function useDeliveries(warningId: string | null) {
  const load = useMemo(
    () => (warningId ? () => api.warnings.deliveries(warningId) : null),
    [warningId],
  );
  const resource = useAsyncResource<DeliveryRecordDto[]>(load);
  const { data, loading, reload } = resource;

  const inProgress =
    data?.some((record) =>
      IN_PROGRESS_DELIVERY_STATUSES.includes(record.status),
    ) ?? false;

  // Poll with a setTimeout after each answer, not setInterval, so requests never
  // overlap; it stops by itself once no channel is in progress.
  useEffect(() => {
    if (!inProgress || loading) {
      return;
    }
    const timer = setTimeout(reload, DELIVERY_POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [inProgress, loading, reload, data]);

  return resource;
}
