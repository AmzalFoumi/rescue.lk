import type { DistrictDto, ResponseTargetDto } from '@rescue-lk/shared';
import { formatDateTime, placeLabel, teamCountLabel } from '../domain/format';
import { HAZARD_PRESENTATION } from '../domain/presentation';
import { Icon } from './icons';
import { Button, Chip, StateMessage } from './ui';

const COLUMNS = 'minmax(150px,1.1fr) minmax(170px,1.3fr) 130px 120px 120px';

/**
 * Step 2 and 3: the verified reports that need a response, with where they are
 * and how many teams are already on them.
 */
export function IncidentsTable({
  reports,
  districts,
  onDispatch,
}: {
  reports: ResponseTargetDto[];
  districts: DistrictDto[];
  onDispatch: (report: ResponseTargetDto) => void;
}) {
  if (reports.length === 0) {
    return (
      <StateMessage kind="empty" message="No incidents match these filters." />
    );
  }
  return (
    <div className="overflow-x-auto">
      <div role="table" aria-label="Incidents" className="min-w-[760px]">
        <div
          role="row"
          className="grid gap-3 px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink-muted"
          style={{ gridTemplateColumns: COLUMNS }}
        >
          <span role="columnheader">Hazard</span>
          <span role="columnheader">Location</span>
          <span role="columnheader">Verified</span>
          <span role="columnheader">Teams</span>
          <span role="columnheader">
            <span className="sr-only">Actions</span>
          </span>
        </div>
        {reports.map((report) => (
          <div
            key={report.id}
            role="row"
            className="grid items-center gap-3 border-t border-line px-4 py-3 text-sm"
            style={{ gridTemplateColumns: COLUMNS }}
          >
            <span role="cell" className="flex items-center gap-2">
              <Icon
                name={HAZARD_PRESENTATION[report.hazardType].icon}
                className="size-4 text-primary"
              />
              {HAZARD_PRESENTATION[report.hazardType].label}
            </span>
            <span role="cell">
              {placeLabel(report.placeName, report.district, districts)}
            </span>
            <span role="cell" className="text-ink-muted">
              {formatDateTime(report.capturedAt)}
            </span>
            <span role="cell">
              {report.needsResponse ? (
                <Chip
                  presentation={{
                    label: 'No team yet',
                    tone: 'caution',
                    icon: 'circle-help',
                  }}
                />
              ) : (
                <Chip
                  presentation={{
                    label: teamCountLabel(report.dispatchedTeams),
                    tone: 'success',
                    icon: 'truck',
                  }}
                />
              )}
            </span>
            <span role="cell">
              <Button
                className="min-h-8 px-3 text-[13px]"
                onClick={() => onDispatch(report)}
                aria-label={`Dispatch a team to the ${HAZARD_PRESENTATION[report.hazardType].label.toLowerCase()} at ${placeLabel(report.placeName, report.district, districts)}`}
              >
                Dispatch
              </Button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
