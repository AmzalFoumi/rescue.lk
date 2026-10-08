'use client';

import { useState } from 'react';
import type { DistrictDto, ShelterDto } from '@rescue-lk/shared';
import { useResponseApi } from '../api/api-context';
import { SheltersTable } from '../components/SheltersTable';
import { Button, Field, INPUT_CLASS, Notice, Panel } from '../components/ui';
import {
  ALL,
  EMPTY_SHELTER_FILTERS,
  filterShelters,
  type ShelterFilters,
} from '../domain/filters';
import { arrivalChange, occupancyChange } from '../domain/occupancy-change';
import { SHELTER_STATUS_PRESENTATION } from '../domain/presentation';
import { useAsyncAction } from '../hooks/use-async-action';

const SHELTER_STATUSES = Object.keys(SHELTER_STATUS_PRESENTATION) as Array<
  keyof typeof SHELTER_STATUS_PRESENTATION
>;

/** The Shelters tab: send evacuees to a shelter and keep the occupancy right. */
export function SheltersTab({
  shelters,
  districts,
  onChanged,
}: {
  shelters: ShelterDto[];
  districts: DistrictDto[];
  onChanged: (message: string) => void;
}) {
  const api = useResponseApi();
  const [filters, setFilters] = useState<ShelterFilters>(EMPTY_SHELTER_FILTERS);
  const [assignTo, setAssignTo] = useState('');
  const [arrivals, setArrivals] = useState('');
  const [assignError, setAssignError] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const visible = filterShelters(shelters, filters, districts);
  const set = (patch: Partial<ShelterFilters>) =>
    setFilters((current) => ({ ...current, ...patch }));

  const send = useAsyncAction(
    async (shelter: ShelterDto, people: number, message: string) => {
      setBusyId(shelter.id);
      try {
        await api.changeOccupancy(shelter.id, people);
        onChanged(message);
      } finally {
        setBusyId(null);
      }
    },
  );

  function assign() {
    const shelter = shelters.find((candidate) => candidate.id === assignTo);
    if (!shelter) {
      setAssignError('Choose a shelter first.');
      return;
    }
    const change = arrivalChange(shelter, Number(arrivals));
    if (!change.ok) {
      setAssignError(change.error);
      return;
    }
    setAssignError(null);
    void send
      .run(
        shelter,
        change.people,
        `${change.people} people sent to ${shelter.name}.`,
      )
      .then((done) => {
        if (done !== undefined) setArrivals('');
      });
  }

  function save(shelter: ShelterDto) {
    const typed = edits[shelter.id] ?? String(shelter.currentOccupancy);
    const change = occupancyChange(shelter, Number(typed));
    if (!change.ok) {
      setRowErrors((current) => ({ ...current, [shelter.id]: change.error }));
      return;
    }
    setRowErrors((current) => {
      const next = { ...current };
      delete next[shelter.id];
      return next;
    });
    void send.run(
      shelter,
      change.people,
      `${shelter.name} now holds ${typed} people.`,
    );
  }

  return (
    <div className="space-y-4">
      <Panel title="Assign evacuees to a shelter">
        <div className="space-y-3 p-4">
          <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
            <Field id="assign-shelter" label="Shelter">
              <select
                id="assign-shelter"
                className={INPUT_CLASS}
                value={assignTo}
                onChange={(event) => setAssignTo(event.target.value)}
              >
                <option value="">Choose a shelter…</option>
                {shelters.map((shelter) => (
                  <option key={shelter.id} value={shelter.id}>
                    {`${shelter.name} — ${shelter.placesAvailable} places left`}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="assign-people" label="Number of people">
              <input
                id="assign-people"
                type="number"
                min={1}
                className={INPUT_CLASS}
                value={arrivals}
                onChange={(event) => setArrivals(event.target.value)}
              />
            </Field>
            <Button onClick={assign} disabled={send.pending}>
              Assign shelter
            </Button>
          </div>
          {assignError && <Notice tone="danger">{assignError}</Notice>}
          {send.error && (
            <Notice tone="danger" onDismiss={send.clearError}>
              {send.error}
            </Notice>
          )}
        </div>
      </Panel>

      <Panel title="Shelter list">
        <div
          role="search"
          className="grid gap-3 border-b border-line px-4 py-3 sm:grid-cols-3"
        >
          <Field id="shelter-search" label="Search shelters">
            <input
              id="shelter-search"
              type="search"
              className={INPUT_CLASS}
              placeholder="Shelter name"
              value={filters.search}
              onChange={(event) => set({ search: event.target.value })}
            />
          </Field>
          <Field id="shelter-status" label="Status">
            <select
              id="shelter-status"
              className={INPUT_CLASS}
              value={filters.status}
              onChange={(event) =>
                set({ status: event.target.value as ShelterFilters['status'] })
              }
            >
              <option value={ALL}>Any status</option>
              {SHELTER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {SHELTER_STATUS_PRESENTATION[status].label}
                </option>
              ))}
            </select>
          </Field>
          <Field id="shelter-district" label="District">
            <select
              id="shelter-district"
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
        </div>
        <SheltersTable
          shelters={visible}
          districts={districts}
          edits={edits}
          errors={rowErrors}
          busyId={busyId}
          onEdit={(id, value) =>
            setEdits((current) => ({ ...current, [id]: value }))
          }
          onSave={save}
        />
      </Panel>
    </div>
  );
}
