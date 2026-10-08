import { RotateCcw, Search } from 'lucide-react';
import type { HazardType, WarningSeverity } from '@rescue-lk/shared';
import {
  ALL,
  type MonitorFilters as Filters,
  type WarningStatusFilter,
} from '../../monitoring';
import { HAZARDS, HAZARD_META, SEVERITIES, SEVERITY_META } from '../../meta';
import { cx, ICON_SIZE, ui } from '../../ui';

interface MonitorFiltersProps {
  filters: Filters;
  districts: readonly string[];
  onChange: (change: Partial<Filters>) => void;
  onReset: () => void;
}

const STATUS_OPTIONS: { value: WarningStatusFilter; label: string }[] = [
  { value: ALL, label: 'All statuses' },
  { value: 'NONE', label: 'No warning yet' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
];

const field = 'flex min-w-[150px] flex-[1_1_150px] flex-col gap-1.5';
const select = cx(ui.input, ui.inputBorder, 'h-10 py-0');

// MonitorFilters are the step 1 filters: search, hazard, district, severity and
// warning status.
// Presentational: the filter values live in useMonitorScreen and the filtering rule in
// monitoring.ts.
export function MonitorFilters({
  filters,
  districts,
  onChange,
  onReset,
}: MonitorFiltersProps) {
  return (
    <div
      role="search"
      className="flex flex-wrap items-end gap-3 rounded-[10px] border border-[#D9DFE5] bg-white px-4 py-3"
    >
      <div className="flex flex-[1_1_220px] flex-col gap-1.5">
        <label htmlFor="wf-q" className={ui.label}>
          Search hazards
        </label>
        <div className="relative">
          <Search
            aria-hidden
            size={ICON_SIZE.medium}
            className="absolute top-3 left-3 text-[#4F5B67]"
          />
          <input
            id="wf-q"
            type="search"
            value={filters.query}
            onChange={(event) => onChange({ query: event.target.value })}
            placeholder="Report ID, place or description"
            className={cx(ui.input, ui.inputBorder, 'h-10 pl-9')}
          />
        </div>
      </div>
      <div className={field}>
        <label htmlFor="wf-hz" className={ui.label}>
          Hazard type
        </label>
        <select
          id="wf-hz"
          value={filters.hazard}
          onChange={(event) =>
            onChange({ hazard: event.target.value as HazardType | 'ALL' })
          }
          className={select}
        >
          <option value={ALL}>All types</option>
          {HAZARDS.map((hazard) => (
            <option key={hazard} value={hazard}>
              {HAZARD_META[hazard].label}
            </option>
          ))}
        </select>
      </div>
      <div className={field}>
        <label htmlFor="wf-d" className={ui.label}>
          District
        </label>
        <select
          id="wf-d"
          value={filters.district}
          onChange={(event) => onChange({ district: event.target.value })}
          className={select}
        >
          <option value={ALL}>All districts</option>
          {districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </div>
      <div className={field}>
        <label htmlFor="wf-sev" className={ui.label}>
          Severity
        </label>
        <select
          id="wf-sev"
          value={filters.severity}
          onChange={(event) =>
            onChange({
              severity: event.target.value as WarningSeverity | 'ALL',
            })
          }
          className={select}
        >
          <option value={ALL}>All severities</option>
          {SEVERITIES.map((severity) => (
            <option key={severity} value={severity}>
              {SEVERITY_META[severity].label}
            </option>
          ))}
        </select>
      </div>
      <div className={field}>
        <label htmlFor="wf-st" className={ui.label}>
          Warning status
        </label>
        <select
          id="wf-st"
          value={filters.warningStatus}
          onChange={(event) =>
            onChange({
              warningStatus: event.target.value as WarningStatusFilter,
            })
          }
          className={select}
        >
          {STATUS_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={onReset}
        className={cx(ui.buttonSecondary, 'h-10')}
      >
        <RotateCcw aria-hidden size={ICON_SIZE.medium} />
        Reset
      </button>
    </div>
  );
}
