'use client';

import { Bell, ClipboardList, Siren } from 'lucide-react';
import { HomeTile } from '../components/HomeTile';
import { ROUTES, WARNINGS_HREF } from '../routes';
import { useReporting } from '../state/reporting-context';
import { CitizenFrame } from './CitizenFrame';

/** The citizen Home: a greeting and the things a citizen can do. */
export function CitizenHome() {
  const { reporter, queue } = useReporting();
  const waiting = queue.queued.length;

  return (
    <CitizenFrame>
      <header>
        <h1 className="text-2xl font-bold">
          Good day, {reporter.name.split(' ')[0]}
        </h1>
        <p className="text-ink-muted">{reporter.districtName} District</p>
      </header>
      <div className="grid grid-cols-2 gap-3">
        <HomeTile
          href={ROUTES.newReport}
          icon={Siren}
          title="Report hazard"
          subtitle="Flood, landslide, fire and more"
        />
        <HomeTile
          href={ROUTES.myReports}
          icon={ClipboardList}
          title="My Reports"
          subtitle={
            waiting > 0 ? `${waiting} waiting to send` : 'Follow your reports'
          }
        />
        <HomeTile
          href={WARNINGS_HREF}
          icon={Bell}
          title="Warnings"
          subtitle="Alerts for your district"
        />
      </div>
    </CitizenFrame>
  );
}
