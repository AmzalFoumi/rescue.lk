'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useHazardReportsApi } from '../api/api-context';
import {
  DEMO_CITIZEN,
  DEMO_OPERATOR,
  type CitizenIdentity,
  type OperatorIdentity,
} from '../domain/identities';
import { useOfflineQueue, type OfflineQueue } from '../hooks/use-offline-queue';

export interface Reporting {
  reporter: CitizenIdentity;
  operator: OperatorIdentity;
  /** The Network switch in the header. Offline means reports are saved, not sent. */
  online: boolean;
  setOnline: (online: boolean) => void;
  queue: OfflineQueue;
}

const ReportingContext = createContext<Reporting | null>(null);

/** Holds who is using the app, whether the network is "on", and the reports saved offline. */
export function ReportingProvider({ children }: { children: ReactNode }) {
  const api = useHazardReportsApi();
  const [online, setOnline] = useState(true);
  const queue = useOfflineQueue(api, online);

  const value = useMemo<Reporting>(
    () => ({
      reporter: DEMO_CITIZEN,
      operator: DEMO_OPERATOR,
      online,
      setOnline,
      queue,
    }),
    [online, queue],
  );

  return (
    <ReportingContext.Provider value={value}>
      {children}
    </ReportingContext.Provider>
  );
}

export function useReporting(): Reporting {
  const value = useContext(ReportingContext);
  if (value === null) {
    throw new Error('useReporting must be used inside ReportingProvider.');
  }
  return value;
}
