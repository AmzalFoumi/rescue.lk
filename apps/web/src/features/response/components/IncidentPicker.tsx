import type { DistrictDto, ResponseTargetDto } from '@rescue-lk/shared';
import { formatDateTime, placeLabel, teamCountLabel } from '../domain/format';
import { HAZARD_PRESENTATION } from '../domain/presentation';
import { Icon } from './icons';
import { StateMessage } from './ui';

/** Step 1 of the dispatch flow: pick the incident the team is going to. */
export function IncidentPicker({
  reports,
  districts,
  selectedId,
  onSelect,
}: {
  reports: ResponseTargetDto[];
  districts: DistrictDto[];
  selectedId: string | null;
  onSelect: (report: ResponseTargetDto) => void;
}) {
  if (reports.length === 0) {
    return (
      <StateMessage
        kind="empty"
        message="No verified report is waiting for a response."
      />
    );
  }
  return (
    <div
      role="radiogroup"
      aria-label="Choose an incident"
      className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {reports.map((report) => {
        const hazard = HAZARD_PRESENTATION[report.hazardType];
        const selected = report.id === selectedId;
        return (
          <button
            key={report.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(report)}
            className={`flex flex-col gap-1 rounded-[8px] border p-3 text-left ${
              selected
                ? 'border-primary bg-primary-tint'
                : 'border-line bg-white hover:bg-page'
            }`}
          >
            <span className="flex items-center gap-2 font-semibold">
              <Icon name={hazard.icon} className="size-4 text-primary" />
              {hazard.label} ·{' '}
              {placeLabel(report.placeName, report.district, districts)}
            </span>
            <span className="text-xs text-ink-muted">
              Verified {formatDateTime(report.capturedAt)} ·{' '}
              {teamCountLabel(report.dispatchedTeams)}
            </span>
            <span className="line-clamp-2 text-[13px] text-ink-muted">
              {report.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
