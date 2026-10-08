'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '@/lib/api';
import type { HazardReportsApi } from '../api/hazard-reports-api';
import type { QueuedReport } from '../domain/queued-report';

/** What the screen shows about sending the saved reports. */
export type SyncState =
  | { phase: 'idle' }
  | { phase: 'syncing'; count: number }
  | { phase: 'done'; synced: number; stillQueued: number }
  | { phase: 'error'; message: string };

export interface OfflineQueue {
  /** Reports saved on this device that are waiting to be sent. */
  queued: QueuedReport[];
  save: (report: Omit<QueuedReport, 'localId'>) => QueuedReport;
  syncState: SyncState;
  /** Sends the saved reports now (also used to try again after a failure). */
  syncNow: () => Promise<void>;
  dismissSync: () => void;
}

const IDLE: SyncState = { phase: 'idle' };

/**
 * Keeps the reports saved while offline and sends them when the network comes back.
 * The server counts are the truth for the banner; the local copies are only what the cards show.
 */
export function useOfflineQueue(
  api: HazardReportsApi,
  online: boolean,
): OfflineQueue {
  const [queued, setQueued] = useState<QueuedReport[]>([]);
  const [syncState, setSyncState] = useState<SyncState>(IDLE);
  const nextLocalId = useRef(1);
  const wasOnline = useRef(online);

  const save = useCallback((report: Omit<QueuedReport, 'localId'>) => {
    const saved: QueuedReport = {
      ...report,
      localId: `local-${nextLocalId.current++}`,
    };
    setQueued((current) => [...current, saved]);
    return saved;
  }, []);

  const send = useCallback(
    async (count: number) => {
      setSyncState({ phase: 'syncing', count });
      try {
        const result = await api.sync();
        // The server only says how many are left, so keep that many of the newest copies.
        setQueued((current) =>
          result.stillQueued === 0 ? [] : current.slice(-result.stillQueued),
        );
        setSyncState({
          phase: 'done',
          synced: result.synced,
          stillQueued: result.stillQueued,
        });
      } catch (error) {
        setSyncState({ phase: 'error', message: errorMessage(error) });
      }
    },
    [api],
  );

  const syncNow = useCallback(() => send(queued.length), [send, queued.length]);
  const dismissSync = useCallback(() => setSyncState(IDLE), []);

  // Send the saved reports once, when the network comes back.
  useEffect(() => {
    const cameBackOnline = online && !wasOnline.current;
    wasOnline.current = online;
    if (cameBackOnline && queued.length > 0) {
      void send(queued.length);
    }
  }, [online, queued.length, send]);

  return { queued, save, syncState, syncNow, dismissSync };
}
