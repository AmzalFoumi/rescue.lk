import type { HazardReportStatus } from '@rescue-lk/shared';
import { STATUS_PRESENTATION } from '../domain/report-status';
import { StatusIcon } from './icons';
import { TONE_CLASSES } from './tone-classes';

/** The coloured label of a report status. Colour is paired with an icon and the status name. */
export function StatusChip({ status }: { status: HazardReportStatus }) {
  const { label, tone, icon } = STATUS_PRESENTATION[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${TONE_CLASSES[tone]}`}
    >
      <StatusIcon name={icon} className="size-3.5" />
      {label}
    </span>
  );
}
