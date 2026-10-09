'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import type { TargetAreaDto } from '@rescue-lk/shared';
import { cx, ICON_SIZE, ui } from '../../ui';
import { FieldError } from '../FieldError';
import { Card } from '../shell/Card';

interface AreaSelectorProps {
  areas: readonly TargetAreaDto[];
  value: readonly string[];
  onChange: (areaIds: string[]) => void;
  error?: string;
}

const SEARCH_ID = 'warning-area-search';
const ERROR_ID = 'warning-areas-error';

const matches = (area: TargetAreaDto, query: string) => {
  const needle = query.trim().toLowerCase();
  return (
    !needle ||
    area.name.toLowerCase().includes(needle) ||
    area.districts.some((district) => district.toLowerCase().includes(needle))
  );
};

const toggle = (ids: readonly string[], id: string) =>
  ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];

interface AreaGroupProps {
  legend: string;
  areas: readonly TargetAreaDto[];
  value: readonly string[];
  onChange: (areaIds: string[]) => void;
  label: (area: TargetAreaDto) => string;
  hasError: boolean;
}

function AreaGroup({
  legend,
  areas,
  value,
  onChange,
  label,
  hasError,
}: AreaGroupProps) {
  if (areas.length === 0) {
    return null;
  }
  return (
    <fieldset
      aria-describedby={hasError ? ERROR_ID : undefined}
      className="min-w-0"
    >
      <legend className={cx(ui.label, 'mb-1')}>{legend}</legend>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {areas.map((area) => (
          <label
            key={area.id}
            className="flex cursor-pointer items-start gap-2 rounded-[6px] px-1 py-1 text-[14px] hover:bg-[#F3F5F7]"
          >
            <input
              type="checkbox"
              checked={value.includes(area.id)}
              onChange={() => onChange(toggle(value, area.id))}
              className="mt-1 size-4 flex-none"
            />
            <span>{label(area)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// AreaSelector is "1. Affected area": districts and river basins with a search box.
// Presentational: the selection lives in the form hook; only the search text is local
// view state, because nothing else needs it.
export function AreaSelector({
  areas,
  value,
  onChange,
  error,
}: AreaSelectorProps) {
  // Search text is view-only state; the selection belongs to the form.
  const [query, setQuery] = useState('');
  const shown = areas.filter((area) => matches(area, query));
  const group = (kind: TargetAreaDto['kind']) =>
    shown.filter((area) => area.kind === kind);

  return (
    <Card title="1. Affected area" titleId="affected-area-title">
      <div className="flex flex-col gap-3.5 p-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={SEARCH_ID} className={ui.label}>
            Search districts or river basins
          </label>
          <div className="relative">
            <Search
              aria-hidden
              size={ICON_SIZE.medium}
              className="absolute top-3 left-3 text-[#4F5B67]"
            />
            <input
              id={SEARCH_ID}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="For example Kalu or Ratnapura"
              autoComplete="off"
              className={cx(
                ui.input,
                'h-10 pl-9',
                error ? ui.inputInvalid : ui.inputBorder,
              )}
            />
          </div>
        </div>
        <AreaGroup
          legend="Districts"
          areas={group('DISTRICT')}
          value={value}
          onChange={onChange}
          label={(area) => area.districts[0]}
          hasError={!!error}
        />
        <AreaGroup
          legend="River basins"
          areas={group('RIVER_BASIN')}
          value={value}
          onChange={onChange}
          label={(area) => `${area.name} (${area.districts.join(', ')})`}
          hasError={!!error}
        />
        {shown.length === 0 && (
          <span className={ui.hint}>No matching district or river basin.</span>
        )}
        <FieldError id={ERROR_ID} message={error} />
      </div>
    </Card>
  );
}
