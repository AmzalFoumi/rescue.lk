'use client';

import type { ReactNode } from 'react';
import { BottomNav } from '../components/BottomNav';
import { ConnectionBanner } from '../components/ConnectionBanner';
import { useReporting } from '../state/reporting-context';

/** The frame around every citizen screen: a phone-width column, the connection banner and the tab bar. */
export function CitizenFrame({ children }: { children: ReactNode }) {
  const { online, queue } = useReporting();

  return (
    <div className="mx-auto max-w-md space-y-4 pb-24">
      <ConnectionBanner
        online={online}
        syncState={queue.syncState}
        onRetry={queue.syncNow}
        onDismiss={queue.dismissSync}
      />
      {children}
      <BottomNav />
    </div>
  );
}
