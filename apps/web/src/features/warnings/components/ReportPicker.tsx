import type { VerifiedHazardReportDto } from '@rescue-lk/shared';
import { shortId } from '../format';
import { HAZARD_META } from '../meta';
import { cx, ui } from '../ui';
import { FieldError, errorProps } from './FieldError';

interface ReportPickerProps {
  reports: readonly VerifiedHazardReportDto[];
  value: string;
  onChange: (reportId: string) => void;
  // An update keeps its source report.
  disabled?: boolean;
  error?: string;
}

const ID = 'warning-source-report';

export const reportLabel = (report: VerifiedHazardReportDto) =>
  `${shortId('R', report.id)} · ${HAZARD_META[report.hazardType].label} · ${report.place}, ${report.districtName}`;

// ReportPicker chooses the source hazard report (verified reports only).
// Presentational: props in, changes out. It is locked when updating an ACTIVE
// warning, because the API does not allow the source report to change.
export function ReportPicker({
  reports,
  value,
  onChange,
  disabled,
  error,
}: ReportPickerProps) {
  const known = !value || reports.some((report) => report.id === value);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={ID} className={ui.label}>
        Source report
      </label>
      <select
        id={ID}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={cx(
          ui.input,
          'h-10 py-0',
          error ? ui.inputInvalid : ui.inputBorder,
        )}
        {...errorProps(`${ID}-error`, error)}
      >
        <option value="">Select a verified report</option>
        {reports.map((report) => (
          <option key={report.id} value={report.id}>
            {reportLabel(report)}
          </option>
        ))}
        {!known && <option value={value}>{shortId('R', value)}</option>}
      </select>
      <span className={ui.hint}>
        {disabled
          ? 'An update keeps the source report of the published warning.'
          : 'Only verified reports can be selected.'}
      </span>
      <FieldError id={`${ID}-error`} message={error} />
    </div>
  );
}
