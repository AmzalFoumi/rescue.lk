import type { DistrictDto, ShelterDto } from '@rescue-lk/shared';
import { districtName, formatNumber, percentage } from '../domain/format';
import { SHELTER_STATUS_PRESENTATION } from '../domain/presentation';
import { shelterTotals } from '../domain/summaries';
import { Button, Chip, INPUT_CLASS, StateMessage } from './ui';

const COLUMNS =
  'minmax(200px,1.5fr) 120px 90px 90px minmax(150px,1.2fr) 130px 200px';

/**
 * The shelter list with its occupancy. Every total in the last row is added up
 * from the rows above it, so the two can never disagree.
 */
export function SheltersTable({
  shelters,
  districts,
  edits,
  errors,
  busyId,
  onEdit,
  onSave,
}: {
  shelters: ShelterDto[];
  districts: DistrictDto[];
  /** What the officer has typed for each shelter, by shelter id. */
  edits: Record<string, string>;
  errors: Record<string, string>;
  busyId?: string | null;
  onEdit: (id: string, value: string) => void;
  onSave: (shelter: ShelterDto) => void;
}) {
  if (shelters.length === 0) {
    return (
      <StateMessage kind="empty" message="No shelters match these filters." />
    );
  }
  const totals = shelterTotals(shelters);
  return (
    <div className="overflow-x-auto">
      <div role="table" aria-label="Shelters" className="min-w-[1000px]">
        <div
          role="row"
          className="grid gap-3 px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink-muted"
          style={{ gridTemplateColumns: COLUMNS }}
        >
          <span role="columnheader">Shelter</span>
          <span role="columnheader">District</span>
          <span role="columnheader">Capacity</span>
          <span role="columnheader">Free</span>
          <span role="columnheader">Occupancy</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Update occupancy</span>
        </div>
        {shelters.map((shelter) => {
          const inputId = `occupancy-${shelter.id}`;
          const error = errors[shelter.id];
          return (
            <div
              key={shelter.id}
              role="row"
              className="grid items-center gap-3 border-t border-line px-4 py-3 text-sm"
              style={{ gridTemplateColumns: COLUMNS }}
            >
              <span role="cell" className="flex flex-col">
                <span className="font-semibold">{shelter.name}</span>
                <span className="text-xs text-ink-muted">
                  {shelter.owner.name}
                </span>
              </span>
              <span role="cell">
                {districtName(shelter.district, districts)}
              </span>
              <span role="cell">{formatNumber(shelter.capacity)}</span>
              <span role="cell">{formatNumber(shelter.placesAvailable)}</span>
              <span role="cell" className="flex flex-col gap-1">
                <span>
                  {formatNumber(shelter.currentOccupancy)} /{' '}
                  {formatNumber(shelter.capacity)} ·{' '}
                  {percentage(shelter.currentOccupancy, shelter.capacity)}
                </span>
                <span
                  className="h-1.5 overflow-hidden rounded-full bg-neutral-bg"
                  aria-hidden="true"
                >
                  <span
                    className="block h-full bg-primary"
                    style={{
                      width: percentage(
                        shelter.currentOccupancy,
                        shelter.capacity,
                      ),
                    }}
                  />
                </span>
              </span>
              <span role="cell">
                <Chip
                  presentation={SHELTER_STATUS_PRESENTATION[shelter.status]}
                />
              </span>
              <span role="cell" className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <label htmlFor={inputId} className="sr-only">
                    {`People in ${shelter.name}`}
                  </label>
                  <input
                    id={inputId}
                    type="number"
                    min={0}
                    max={shelter.capacity}
                    className={`${INPUT_CLASS} min-h-8 w-24 text-[13px]`}
                    value={
                      edits[shelter.id] ?? String(shelter.currentOccupancy)
                    }
                    onChange={(event) => onEdit(shelter.id, event.target.value)}
                  />
                  <Button
                    variant="outline"
                    className="min-h-8 px-3 text-[13px]"
                    disabled={busyId === shelter.id}
                    onClick={() => onSave(shelter)}
                  >
                    Save
                  </Button>
                </span>
                {error && (
                  <span role="alert" className="text-xs text-danger-fg">
                    {error}
                  </span>
                )}
              </span>
            </div>
          );
        })}
        <div
          role="row"
          className="grid gap-3 border-t-2 border-line bg-page px-4 py-3 text-sm font-semibold"
          style={{ gridTemplateColumns: COLUMNS }}
        >
          <span role="cell">{`Total (${totals.shelters} shelters)`}</span>
          <span role="cell" />
          <span role="cell">{formatNumber(totals.capacity)}</span>
          <span role="cell">{formatNumber(totals.placesAvailable)}</span>
          <span role="cell">
            {formatNumber(totals.occupancy)} / {formatNumber(totals.capacity)} ·{' '}
            {totals.percentage}
          </span>
          <span role="cell" />
          <span role="cell" />
        </div>
      </div>
    </div>
  );
}
