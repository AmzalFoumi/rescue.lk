import type { WarningSeverity } from '@rescue-lk/shared';
import { SEVERITIES, SEVERITY_META, type Tone } from '../meta';
import { cx, ICON_SIZE } from '../ui';
import { FieldError } from './FieldError';

interface SeverityPickerProps {
  value: WarningSeverity | '';
  onChange: (severity: WarningSeverity) => void;
  error?: string;
}

const ERROR_ID = 'warning-severity-error';

// Label colour per tone, and the border and background of the chosen option.
const LABEL: Record<Tone, string> = {
  red: 'text-[#9F1D1D]',
  orange: 'text-[#A3420E]',
  amber: 'text-[#7A5300]',
  blue: 'text-[#1C4E8C]',
  green: 'text-[#1B6A3B]',
  gray: 'text-[#46525F]',
};
const CHOSEN: Record<Tone, string> = {
  red: 'has-[:checked]:border-[#9F1D1D] has-[:checked]:bg-[#FCEDED]',
  orange: 'has-[:checked]:border-[#A3420E] has-[:checked]:bg-[#FDF1E7]',
  amber: 'has-[:checked]:border-[#7A5300] has-[:checked]:bg-[#FAF3DF]',
  blue: 'has-[:checked]:border-[#1C4E8C] has-[:checked]:bg-[#E9F0F9]',
  green: 'has-[:checked]:border-[#1B6A3B] has-[:checked]:bg-[#E7F3EC]',
  gray: 'has-[:checked]:border-[#46525F] has-[:checked]:bg-[#EEF1F4]',
};

// SeverityPicker is "Select warning level": one radio per severity with its meaning.
// Presentational: the choice lives in the form hook.
// Colours come from meta.ts (no magic values), and the level is always written out,
// so colour is never the only signal.
export function SeverityPicker({
  value,
  onChange,
  error,
}: SeverityPickerProps) {
  return (
    <fieldset
      aria-describedby={error ? ERROR_ID : undefined}
      className="min-w-0"
    >
      <legend className="mb-2 text-[13px] font-semibold text-[#2E3A46]">
        Select warning level
      </legend>
      <div className="flex flex-col gap-2">
        {SEVERITIES.map((severity) => {
          const { label, icon: Icon, tone, hint } = SEVERITY_META[severity];
          return (
            <label
              key={severity}
              className={cx(
                'flex cursor-pointer items-center gap-2.5 rounded-[8px] border border-[#C5CDD6] bg-white px-3 py-2.5 has-[:checked]:border-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#1D4E89]',
                CHOSEN[tone],
              )}
            >
              <input
                type="radio"
                name="warning-severity"
                value={severity}
                checked={value === severity}
                onChange={() => onChange(severity)}
                className="size-4 shrink-0"
              />
              <span
                className={cx(
                  'flex w-24 shrink-0 items-center gap-1.5 text-[14px] font-bold',
                  LABEL[tone],
                )}
              >
                <Icon aria-hidden size={ICON_SIZE.medium} />
                {label}
              </span>
              <span className="text-[13px] text-[#2E3A46]">{hint}</span>
            </label>
          );
        })}
      </div>
      <FieldError id={ERROR_ID} message={error} />
    </fieldset>
  );
}
