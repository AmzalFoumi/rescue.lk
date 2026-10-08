import type { HazardType } from '@rescue-lk/shared';
import { HAZARD_TYPE_OPTIONS } from '../domain/hazard-types';
import type { DraftErrors, ReportDraft } from '../domain/report-draft';
import { ErrorText } from './ErrorText';
import { HazardIcon } from './icons';
import { INPUT_CLASS } from './tone-classes';

interface HazardTypeStepProps {
  hazardType: HazardType | null;
  otherHazard: string;
  errors: DraftErrors;
  onChange: (changes: Partial<ReportDraft>) => void;
}

/** Step 1: choose the type of hazard. "Other" asks what kind of hazard it is. */
export function HazardTypeStep({
  hazardType,
  otherHazard,
  errors,
  onChange,
}: HazardTypeStepProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 text-ink-muted">
        What are you reporting? Choose the one that fits best.
      </legend>
      {HAZARD_TYPE_OPTIONS.map((option) => (
        <label
          key={option.value}
          className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-[10px] border px-4 ${
            hazardType === option.value
              ? 'border-primary bg-primary-tint'
              : 'border-line bg-white'
          }`}
        >
          <input
            type="radio"
            name="hazardType"
            value={option.value}
            checked={hazardType === option.value}
            onChange={() => onChange({ hazardType: option.value })}
            className="size-5 accent-primary"
          />
          <HazardIcon name={option.icon} className="size-6 text-primary" />
          <span className="font-semibold">{option.label}</span>
        </label>
      ))}
      {errors.hazardType && <ErrorText>{errors.hazardType}</ErrorText>}

      {hazardType === 'other' && (
        <div>
          <label htmlFor="other-hazard" className="mb-1 block font-semibold">
            What kind of hazard?
          </label>
          <input
            id="other-hazard"
            value={otherHazard}
            onChange={(event) => onChange({ otherHazard: event.target.value })}
            aria-invalid={Boolean(errors.otherHazard)}
            className={INPUT_CLASS}
          />
          {errors.otherHazard && <ErrorText>{errors.otherHazard}</ErrorText>}
        </div>
      )}
    </fieldset>
  );
}
