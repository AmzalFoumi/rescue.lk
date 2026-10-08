import { useCallback } from 'react';
import type { DistrictDto } from '@rescue-lk/shared';
import type {
  DraftErrors,
  LocationDraft,
  ReportDraft,
} from '../domain/report-draft';
import { ErrorText } from './ErrorText';
import { LocationPicker } from './LocationPicker';
import { INPUT_CLASS } from './tone-classes';

interface DetailsStepProps {
  draft: ReportDraft;
  districts: readonly DistrictDto[];
  errors: DraftErrors;
  /** `onChange` must keep the same identity between renders (the wizard's `change` does). */
  onChange: (changes: Partial<ReportDraft>) => void;
}

/** Step 2: where the hazard is, and what the reporter sees. */
export function DetailsStep({
  draft,
  districts,
  errors,
  onChange,
}: DetailsStepProps) {
  const handleLocation = useCallback(
    (location: LocationDraft | null) => onChange({ location }),
    [onChange],
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="mb-2 font-semibold">Location</h2>
        <LocationPicker
          location={draft.location}
          districts={districts}
          error={errors.location}
          onChange={handleLocation}
        />
      </div>
      <div>
        <label htmlFor="description" className="mb-1 block font-semibold">
          Description
        </label>
        <p id="description-help" className="mb-2 text-sm text-ink-muted">
          What do you see? Include water depth, blocked roads or people who need
          help.
        </p>
        <textarea
          id="description"
          rows={5}
          value={draft.description}
          onChange={(event) => onChange({ description: event.target.value })}
          aria-describedby="description-help"
          aria-invalid={Boolean(errors.description)}
          className={INPUT_CLASS}
        />
        {errors.description && <ErrorText>{errors.description}</ErrorText>}
      </div>
    </div>
  );
}
