'use client';

import { useState } from 'react';
import type {
  DistrictDto,
  RescueTeamDto,
  ResponseTargetDto,
  TeamStatus,
} from '@rescue-lk/shared';
import { useResponseApi } from '../api/api-context';
import { DispatchDialog } from '../components/DispatchDialog';
import { IncidentPicker } from '../components/IncidentPicker';
import { StepBar } from '../components/StepBar';
import { TeamsTable } from '../components/TeamsTable';
import { Button, Field, INPUT_CLASS, Notice, Panel } from '../components/ui';
import { districtName, placeLabel } from '../domain/format';
import {
  ALL,
  EMPTY_TEAM_FILTERS,
  filterTeams,
  type TeamFilters,
} from '../domain/filters';
import { DEMO_OFFICER } from '../domain/identities';
import {
  ORGANISATION_KIND_LABELS,
  TEAM_STATUS_PRESENTATION,
} from '../domain/presentation';
import { useAsyncAction } from '../hooks/use-async-action';

const OWNER_KINDS = Object.keys(ORGANISATION_KIND_LABELS) as Array<
  keyof typeof ORGANISATION_KIND_LABELS
>;
const TEAM_STATUSES = Object.keys(TEAM_STATUS_PRESENTATION) as TeamStatus[];

/** The Dispatch tab: choose an incident, choose a team, confirm (steps 1 to 8). */
export function DispatchTab({
  reports,
  teams,
  districts,
  selectedReport,
  onSelectReport,
  onDispatched,
}: {
  reports: ResponseTargetDto[];
  teams: RescueTeamDto[];
  districts: DistrictDto[];
  selectedReport: ResponseTargetDto | null;
  onSelectReport: (report: ResponseTargetDto | null) => void;
  /** Called after a successful dispatch or status change so the lists reload. */
  onDispatched: (message: string) => void;
}) {
  const api = useResponseApi();
  const [filters, setFilters] = useState<TeamFilters>(EMPTY_TEAM_FILTERS);
  const [candidate, setCandidate] = useState<RescueTeamDto | null>(null);
  const [busyTeamId, setBusyTeamId] = useState<string | null>(null);

  const set = (patch: Partial<TeamFilters>) =>
    setFilters((current) => ({ ...current, ...patch }));

  const visibleTeams = filterTeams(teams, filters, selectedReport?.district);
  const availableHere = visibleTeams.filter(
    (team) => team.status === 'available',
  );

  const dispatch = useAsyncAction(async (team: RescueTeamDto) => {
    if (!selectedReport) return;
    await api.dispatch(selectedReport.id, team.id, DEMO_OFFICER.id);
    setCandidate(null);
    onDispatched(`${team.name} is on the way.`);
  });

  const changeStatus = useAsyncAction(
    async (team: RescueTeamDto, status: TeamStatus) => {
      setBusyTeamId(team.id);
      try {
        await api.changeTeamStatus(team.id, status);
        onDispatched(
          `${team.name} is now ${TEAM_STATUS_PRESENTATION[status].label.toLowerCase()}.`,
        );
      } finally {
        setBusyTeamId(null);
      }
    },
  );

  // Step 3 is reached only once a team has been chosen and the dialog is open.
  const step = selectedReport === null ? 0 : candidate === null ? 1 : 2;

  return (
    <div className="space-y-4">
      <StepBar current={step} />

      <Panel title="1. Verified reports needing a response">
        <IncidentPicker
          reports={reports}
          districts={districts}
          selectedId={selectedReport?.id ?? null}
          onSelect={(report) => {
            onSelectReport(report);
            setCandidate(null);
          }}
        />
      </Panel>

      <Panel
        title="2. Rescue teams, all organisations"
        action={
          selectedReport && (
            <Button
              variant="outline"
              className="min-h-8 px-3 text-[13px]"
              onClick={() => onSelectReport(null)}
            >
              Clear incident
            </Button>
          )
        }
      >
        <p className="border-b border-line px-4 py-2.5 text-[13px] text-ink-muted">
          {selectedReport
            ? `Dispatching to ${placeLabel(selectedReport.placeName, selectedReport.district, districts)}.`
            : 'Choose an incident above to turn the Dispatch buttons on.'}
        </p>
        <div
          role="search"
          className="grid gap-3 border-b border-line px-4 py-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          <Field id="team-search" label="Search teams">
            <input
              id="team-search"
              type="search"
              className={INPUT_CLASS}
              placeholder="Team or organisation"
              value={filters.search}
              onChange={(event) => set({ search: event.target.value })}
            />
          </Field>
          <Field id="team-owner" label="Owner">
            <select
              id="team-owner"
              className={INPUT_CLASS}
              value={filters.owner}
              onChange={(event) =>
                set({ owner: event.target.value as TeamFilters['owner'] })
              }
            >
              <option value={ALL}>All organisations</option>
              {OWNER_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {ORGANISATION_KIND_LABELS[kind]}
                </option>
              ))}
            </select>
          </Field>
          <Field id="team-status" label="Availability">
            <select
              id="team-status"
              className={INPUT_CLASS}
              value={filters.status}
              onChange={(event) =>
                set({ status: event.target.value as TeamFilters['status'] })
              }
            >
              <option value={ALL}>Any status</option>
              {TEAM_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {TEAM_STATUS_PRESENTATION[status].label}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4"
                checked={filters.nearbyOnly}
                disabled={selectedReport === null}
                onChange={(event) => set({ nearbyOnly: event.target.checked })}
              />
              {selectedReport
                ? `Only ${districtName(selectedReport.district, districts)}`
                : 'Only the incident district'}
            </label>
          </div>
        </div>

        {changeStatus.error && (
          <div className="px-4 pt-3">
            <Notice tone="danger" onDismiss={changeStatus.clearError}>
              {changeStatus.error}
            </Notice>
          </div>
        )}
        {/* Extension 5.a: nothing to dispatch, so the officer is told instead. */}
        {availableHere.length === 0 && (
          <div className="px-4 pt-3">
            <Notice tone="caution">
              <strong>No team available.</strong> No dispatch can be made with
              these filters.
              {filters.nearbyOnly && selectedReport && (
                <>
                  {' '}
                  <button
                    type="button"
                    className="font-semibold underline"
                    onClick={() => set({ nearbyOnly: false })}
                  >
                    Show all districts
                  </button>
                </>
              )}
            </Notice>
          </div>
        )}

        <TeamsTable
          teams={visibleTeams}
          districts={districts}
          canDispatch={selectedReport !== null}
          busyTeamId={busyTeamId}
          onDispatch={setCandidate}
          onChangeStatus={(team, status) => changeStatus.run(team, status)}
        />
      </Panel>

      {selectedReport && candidate && (
        <DispatchDialog
          report={selectedReport}
          team={candidate}
          districts={districts}
          pending={dispatch.pending}
          error={dispatch.error}
          onConfirm={() => dispatch.run(candidate)}
          onCancel={() => {
            dispatch.clearError();
            setCandidate(null);
          }}
        />
      )}
    </div>
  );
}
