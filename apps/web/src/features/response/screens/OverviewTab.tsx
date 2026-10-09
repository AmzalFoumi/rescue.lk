'use client';

import { useState } from 'react';
import type {
  DistrictDto,
  ReliefDistributionDto,
  RescueTeamDto,
  ResponseTargetDto,
  ShelterDto,
} from '@rescue-lk/shared';
import { IncidentsTable } from '../components/IncidentsTable';
import { Icon } from '../components/icons';
import {
  Chip,
  Field,
  INPUT_CLASS,
  Panel,
  StateMessage,
} from '../components/ui';
import { districtName, formatNumber, percentage } from '../domain/format';
import {
  ALL,
  EMPTY_INCIDENT_FILTERS,
  filterIncidents,
  type IncidentFilters,
} from '../domain/filters';
import {
  HAZARD_PRESENTATION,
  SHELTER_STATUS_PRESENTATION,
  TEAM_STATUS_PRESENTATION,
} from '../domain/presentation';
import { reliefByDistrict, teamStatusCounts } from '../domain/summaries';

const HAZARD_TYPES = Object.keys(HAZARD_PRESENTATION) as Array<
  keyof typeof HAZARD_PRESENTATION
>;

/** The Overview tab: what needs a response, and how the response is going. */
export function OverviewTab({
  reports,
  teams,
  shelters,
  relief,
  districts,
  onDispatch,
}: {
  reports: ResponseTargetDto[];
  teams: RescueTeamDto[];
  shelters: ShelterDto[];
  relief: ReliefDistributionDto[];
  districts: DistrictDto[];
  onDispatch: (report: ResponseTargetDto) => void;
}) {
  const [filters, setFilters] = useState<IncidentFilters>(
    EMPTY_INCIDENT_FILTERS,
  );
  const visible = filterIncidents(reports, filters, districts);
  const set = (patch: Partial<IncidentFilters>) =>
    setFilters((current) => ({ ...current, ...patch }));

  const deployed = teams.filter((team) => team.status === 'dispatched');
  const reliefRows = reliefByDistrict(relief, districts);

  return (
    <div className="space-y-4">
      <Panel title="Incidents requiring response">
        <div
          role="search"
          className="grid gap-3 border-b border-line px-4 py-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          <Field id="incident-search" label="Search incidents">
            <input
              id="incident-search"
              type="search"
              className={INPUT_CLASS}
              placeholder="Place or description"
              value={filters.search}
              onChange={(event) => set({ search: event.target.value })}
            />
          </Field>
          <Field id="incident-hazard" label="Hazard type">
            <select
              id="incident-hazard"
              className={INPUT_CLASS}
              value={filters.hazardType}
              onChange={(event) =>
                set({
                  hazardType: event.target
                    .value as IncidentFilters['hazardType'],
                })
              }
            >
              <option value={ALL}>All hazard types</option>
              {HAZARD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {HAZARD_PRESENTATION[type].label}
                </option>
              ))}
            </select>
          </Field>
          <Field id="incident-district" label="District">
            <select
              id="incident-district"
              className={INPUT_CLASS}
              value={filters.district}
              onChange={(event) => set({ district: event.target.value })}
            >
              <option value={ALL}>All districts</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
          </Field>
          <Field id="incident-status" label="Response status">
            <select
              id="incident-status"
              className={INPUT_CLASS}
              value={filters.responseStatus}
              onChange={(event) =>
                set({
                  responseStatus: event.target
                    .value as IncidentFilters['responseStatus'],
                })
              }
            >
              <option value={ALL}>Any status</option>
              <option value="needs_response">Awaiting a team</option>
              <option value="has_team">Team on the way</option>
            </select>
          </Field>
        </div>
        <IncidentsTable
          reports={visible}
          districts={districts}
          onDispatch={onDispatch}
        />
        <p className="border-t border-line px-4 py-2 text-[13px] text-ink-muted">
          {`Showing ${visible.length} of ${reports.length} incidents.`}
        </p>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Team status">
          <div className="grid grid-cols-2 gap-2 p-4">
            {teamStatusCounts(teams).map((count) => (
              <div
                key={count.status}
                className="rounded-[8px] border border-line px-3 py-2"
              >
                <span className="block text-xl font-bold">{count.count}</span>
                <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <Icon name={count.icon} className="size-3.5" />
                  {count.label}
                </span>
              </div>
            ))}
          </div>
          {deployed.length === 0 ? (
            <StateMessage kind="empty" message="No team is out right now." />
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {deployed.map((team) => (
                <li
                  key={team.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                >
                  <span className="flex flex-col">
                    <span className="font-semibold">{team.name}</span>
                    <span className="text-xs text-ink-muted">
                      {team.owner.name}
                    </span>
                  </span>
                  <Chip presentation={TEAM_STATUS_PRESENTATION.dispatched} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Shelter status">
          {shelters.length === 0 ? (
            <StateMessage kind="empty" message="No shelters are registered." />
          ) : (
            <ul className="divide-y divide-line">
              {shelters.map((shelter) => (
                <li
                  key={shelter.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold">
                      {shelter.name}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {districtName(shelter.district, districts)}
                    </span>
                  </span>
                  <span className="flex flex-none items-center gap-2">
                    <span className="text-xs text-ink-muted">
                      {shelter.currentOccupancy} / {shelter.capacity}
                    </span>
                    <Chip
                      presentation={SHELTER_STATUS_PRESENTATION[shelter.status]}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Relief distributed by district">
          {reliefRows.length === 0 ? (
            <StateMessage
              kind="empty"
              message="No relief supplies have been logged yet."
            />
          ) : (
            <div className="space-y-2.5 p-4">
              {reliefRows.map((row) => (
                <div
                  key={row.district}
                  className="grid grid-cols-[minmax(80px,1fr)_minmax(0,2fr)_auto] items-center gap-2 text-sm"
                >
                  <span className="truncate">{row.name}</span>
                  <span
                    className="h-2 overflow-hidden rounded-full bg-neutral-bg"
                    aria-hidden="true"
                  >
                    <span
                      className="block h-full bg-primary"
                      style={{ width: percentage(row.share, 1) }}
                    />
                  </span>
                  <span className="text-right font-semibold">
                    {formatNumber(row.quantity)}
                  </span>
                </div>
              ))}
              <p className="text-xs text-ink-muted">
                Items delivered, all organisations.
              </p>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
