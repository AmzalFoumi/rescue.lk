import type { WarningHazardType } from '@rescue-lk/shared';
import { OTHER_HAZARD, OTHER_HAZARD_MAX_LENGTH } from '../constants';
import { HAZARD_META, HAZARDS } from '../meta';
import { cx, ui } from '../ui';
import { FieldError, errorProps } from './FieldError';

interface HazardPickerProps {
  hazard: WarningHazardType | '';
  otherHazard: string;
  onHazardChange: (hazard: WarningHazardType | '') => void;
  onOtherHazardChange: (name: string) => void;
  hazardError?: string;
  otherHazardError?: string;
}

const HAZARD_ID = 'warning-hazard';
const OTHER_ID = 'warning-other-hazard';

// HazardPicker chooses the hazard type, plus a name field when OTHER is chosen.
// Presentational: props in, changes out; the hazard list comes from meta.ts.
export function HazardPicker({
  hazard,
  otherHazard,
  onHazardChange,
  onOtherHazardChange,
  hazardError,
  otherHazardError,
}: HazardPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label htmlFor={HAZARD_ID} className={ui.label}>
          Hazard type
        </label>
        <select
          id={HAZARD_ID}
          value={hazard}
          onChange={(event) =>
            onHazardChange(event.target.value as WarningHazardType | '')
          }
          className={cx(
            ui.input,
            'mt-1',
            hazardError ? ui.inputInvalid : ui.inputBorder,
          )}
          {...errorProps(`${HAZARD_ID}-error`, hazardError)}
        >
          <option value="">Choose hazard type</option>
          {HAZARDS.map((type) => (
            <option key={type} value={type}>
              {HAZARD_META[type].label}
            </option>
          ))}
        </select>
        <FieldError id={`${HAZARD_ID}-error`} message={hazardError} />
      </div>
      {hazard === OTHER_HAZARD && (
        <div>
          <label htmlFor={OTHER_ID} className={ui.label}>
            Name of hazard
          </label>
          <input
            id={OTHER_ID}
            type="text"
            value={otherHazard}
            maxLength={OTHER_HAZARD_MAX_LENGTH}
            onChange={(event) => onOtherHazardChange(event.target.value)}
            className={cx(
              ui.input,
              'mt-1',
              otherHazardError ? ui.inputInvalid : ui.inputBorder,
            )}
            {...errorProps(`${OTHER_ID}-error`, otherHazardError)}
          />
          <FieldError id={`${OTHER_ID}-error`} message={otherHazardError} />
        </div>
      )}
    </div>
  );
}
