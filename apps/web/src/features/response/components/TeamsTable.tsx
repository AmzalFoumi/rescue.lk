import type { DistrictDto, RescueTeamDto, TeamStatus } from '@rescue-lk/shared';
import { districtName } from '../domain/format';
import {
  MANUAL_TEAM_STATUS_CHANGES,
  ORGANISATION_KIND_LABELS,
  TEAM_STATUS_PRESENTATION,
} from '../domain/presentation';
import { Button, Chip, INPUT_CLASS, StateMessage } from './ui';

const COLUMNS =
  'minmax(180px,1.4fr) minmax(170px,1.2fr) 150px minmax(120px,1fr) 190px';

/**
 * Step 5: every organisation's teams in one list, with their owner, status and
 * district, and the Dispatch button for the ones that are free.
 */
export function TeamsTable({
  teams,
  districts,
  canDispatch,
  onDispatch,
  onChangeStatus,
  busyTeamId,
}: {
  teams: RescueTeamDto[];
  districts: DistrictDto[];
  /** False until the officer has chosen an incident to respond to. */
  canDispatch: boolean;
  onDispatch: (team: RescueTeamDto) => void;
  onChangeStatus: (team: RescueTeamDto, status: TeamStatus) => void;
  busyTeamId?: string | null;
}) {
  if (teams.length === 0) {
    return (
      <StateMessage kind="empty" message="No teams match these filters." />
    );
  }
  return (
    <div className="overflow-x-auto">
      <div role="table" aria-label="Rescue teams" className="min-w-[860px]">
        <div
          role="row"
          className="grid gap-3 px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink-muted"
          style={{ gridTemplateColumns: COLUMNS }}
        >
          <span role="columnheader">Team</span>
          <span role="columnheader">Owner</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">District</span>
          <span role="columnheader">Action</span>
        </div>
        {teams.map((team) => {
          const available = team.status === 'available';
          const nextStatuses = MANUAL_TEAM_STATUS_CHANGES[team.status];
          const busy = busyTeamId === team.id;
          return (
            <div
              key={team.id}
              role="row"
              className="grid items-center gap-3 border-t border-line px-4 py-3 text-sm"
              style={{ gridTemplateColumns: COLUMNS }}
            >
              <span role="cell" className="font-semibold">
                {team.name}
              </span>
              <span role="cell" className="flex flex-col">
                <span>{team.owner.name}</span>
                <span className="text-xs text-ink-muted">
                  {ORGANISATION_KIND_LABELS[team.owner.kind]}
                </span>
              </span>
              <span role="cell">
                <Chip presentation={TEAM_STATUS_PRESENTATION[team.status]} />
              </span>
              <span role="cell">{districtName(team.district, districts)}</span>
              <span role="cell" className="flex items-center gap-2">
                {available ? (
                  <Button
                    className="min-h-8 px-3 text-[13px]"
                    disabled={!canDispatch || busy}
                    title={
                      canDispatch
                        ? undefined
                        : 'Choose an incident above before dispatching'
                    }
                    onClick={() => onDispatch(team)}
                  >
                    Dispatch
                  </Button>
                ) : null}
                {nextStatuses.length > 0 && (
                  <>
                    <label
                      htmlFor={`status-${team.id}`}
                      className="sr-only"
                    >{`Change the status of ${team.name}`}</label>
                    <select
                      id={`status-${team.id}`}
                      className={`${INPUT_CLASS} min-h-8 w-auto text-[13px]`}
                      value=""
                      disabled={busy}
                      onChange={(event) =>
                        onChangeStatus(team, event.target.value as TeamStatus)
                      }
                    >
                      <option value="">Set status…</option>
                      {nextStatuses.map((status) => (
                        <option key={status} value={status}>
                          {TEAM_STATUS_PRESENTATION[status].label}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
