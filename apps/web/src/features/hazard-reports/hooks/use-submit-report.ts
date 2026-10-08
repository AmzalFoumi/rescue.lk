'use client';

import { useCallback } from 'react';
import type {
  HazardReportDto,
  SubmitHazardReportRequest,
} from '@rescue-lk/shared';
import { useHazardReportsApi } from '../api/api-context';
import type { QueuedReport } from '../domain/queued-report';
import { useReporting } from '../state/reporting-context';

/** What happened to a submitted report. */
export type SubmitOutcome =
  | { kind: 'sent'; report: HazardReportDto }
  | { kind: 'queued'; queued: QueuedReport; pendingCount: number };

/**
 * Online: sends the report. Offline: puts it in the offline queue
 * (the server's mock queue) and keeps a copy on this device.
 */
export function useSubmitReport(): (
  request: SubmitHazardReportRequest,
) => Promise<SubmitOutcome> {
  const api = useHazardReportsApi();
  const { online, queue } = useReporting();
  const { save } = queue;

  return useCallback(
    async (request) => {
      if (online) {
        return { kind: 'sent', report: await api.submit(request) };
      }
      const { pendingCount } = await api.queueOffline(request);
      const queued = save({ request, savedAt: new Date().toISOString() });
      return { kind: 'queued', queued, pendingCount };
    },
    [api, online, save],
  );
}
