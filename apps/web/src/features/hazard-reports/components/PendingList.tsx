import type { DistrictDto, HazardReportDto } from '@rescue-lk/shared';
import { formatAge } from '../domain/format';
import { findHazardType, hazardTitle } from '../domain/hazard-types';
import { describePlace } from '../domain/report-card';
import { shortReportId } from '../domain/report-id';
import { HazardIcon } from './icons';
import { TONE_CLASSES } from './tone-classes';

interface PendingListProps {
  reports: readonly HazardReportDto[];
  selectedId: string | null;
  districts: readonly DistrictDto[];
  now: Date;
  onSelect: (id: string) => void;
}

/** The operator's queue: reports waiting for a decision, oldest first. */
export function PendingList({
  reports,
  selectedId,
  districts,
  now,
  onSelect,
}: PendingListProps) {
  return (
    <section
      aria-labelledby="pending-heading"
      className="rounded-[10px] border border-line bg-white"
    >
      <h2
        id="pending-heading"
        className="flex items-center justify-between border-b border-line p-4 font-semibold"
      >
        Pending Verification
        <span className="rounded-full bg-page px-2 text-sm">
          {reports.length}
        </span>
      </h2>
      <ul className="divide-y divide-line">
        {reports.map((report) => (
          <li key={report.id}>
            <button
              type="button"
              aria-current={report.id === selectedId ? 'true' : undefined}
              onClick={() => onSelect(report.id)}
              className={`flex w-full items-start gap-3 p-4 text-left ${report.id === selectedId ? 'bg-primary-tint' : ''}`}
            >
              <HazardIcon
                name={findHazardType(report.hazardType).icon}
                className="mt-1 size-6 shrink-0 text-primary"
              />
              <span className="min-w-0 flex-1">
                <span className="flex justify-between gap-2">
                  <span className="font-semibold">
                    {hazardTitle(report.hazardType, report.otherHazard)}
                  </span>
                  <span className="font-mono text-sm text-ink-muted">
                    {shortReportId(report.id)}
                  </span>
                </span>
                <span className="block text-sm text-ink-muted">
                  {describePlace(report, districts)} ·{' '}
                  {formatAge(report.capturedAt, now)}
                </span>
                {report.possibleDuplicateOf.length > 0 && (
                  <span
                    className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-xs font-bold ${TONE_CLASSES.caution}`}
                  >
                    Possible duplicate
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
