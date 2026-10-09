'use client';

import Link from 'next/link';
import { useReporting } from '../state/reporting-context';
import { ROUTES } from '../routes';

/**
 * The strip above the UC2 screens. It replaces the design's "Dev tools" bar:
 * a Network switch (to try offline reporting) and a link between the two roles.
 */
export function ReportingHeader() {
  const { online, setOnline } = useReporting();

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-line bg-white px-4 py-3">
      <label className="flex cursor-pointer items-center gap-2 font-semibold">
        <input
          type="checkbox"
          role="switch"
          checked={online}
          onChange={(event) => setOnline(event.target.checked)}
          className="size-5 accent-primary"
        />
        Network: {online ? 'Online' : 'Offline'}
      </label>
      <nav
        aria-label="Role"
        className="flex gap-4 text-sm font-semibold text-primary"
      >
        <Link href={ROUTES.home}>Citizen app</Link>
        <Link href={ROUTES.verify}>DMC Operator</Link>
      </nav>
    </div>
  );
}
