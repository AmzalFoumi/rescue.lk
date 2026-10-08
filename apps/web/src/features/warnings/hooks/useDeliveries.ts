import { useEffect, useMemo } from 'react';
import type { DeliveryRecordDto } from '@rescue-lk/shared';
import { api } from '@/lib/api';
import {
  DELIVERY_POLL_INTERVAL_MS,
  IN_PROGRESS_DELIVERY_STATUSES,
} from '../constants';
import { useAsyncResource } from './useAsyncResource';

// Per-channel delivery status of a warning's current version. Keeps polling
// while any channel is still QUEUED or RETRYING, then stops.
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

  useEffect(() => {
    if (!inProgress || loading) {
      return;
    }
    const timer = setTimeout(reload, DELIVERY_POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [inProgress, loading, reload, data]);

  return resource;
}
