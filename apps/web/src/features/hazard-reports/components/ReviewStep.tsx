import type { ReviewRow } from '../domain/review-rows';
import type { WizardStep } from '../domain/report-draft';
import { Button } from './Button';
import { CARD_CLASS } from './tone-classes';

interface ReviewStepProps {
  rows: readonly ReviewRow[];
  online: boolean;
  submitting: boolean;
  /** Why the last attempt to send failed, if it did. */
  error: string | null;
  onEdit: (step: WizardStep) => void;
  onSubmit: () => void;
}

export const OFFLINE_REVIEW_NOTICE =
  'No internet connection. Your report will be saved on this phone and sent automatically when you are back online.';

/** Step 4: check everything, go back to change it, then send (or save on the phone when offline). */
export function ReviewStep({
  rows,
  online,
  submitting,
  error,
  onEdit,
  onSubmit,
}: ReviewStepProps) {
  const buttonLabel = online ? 'Submit report' : 'Save report on this phone';

  return (
    <div className="space-y-4">
      <p className="text-ink-muted">Check your report before sending it.</p>
      <dl className={`${CARD_CLASS} divide-y divide-line`}>
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div>
              <dt className="text-xs font-semibold uppercase text-ink-muted">
                {row.label}
              </dt>
              <dd className="mt-1">{row.value}</dd>
            </div>
            {row.editStep && (
              <button
                type="button"
                aria-label={`Edit ${row.label}`}
                onClick={() => onEdit(row.editStep!)}
                className="font-semibold text-primary underline"
              >
                Edit
              </button>
            )}
          </div>
        ))}
      </dl>
      {!online && (
        <p
          role="status"
          className="rounded-[10px] border border-neutral-bd bg-neutral-bg p-3 text-neutral-fg"
        >
          {OFFLINE_REVIEW_NOTICE}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-[10px] border border-danger-bd bg-danger-bg p-3 text-danger-fg"
        >
          {error}
        </p>
      )}
      <Button className="w-full" onClick={onSubmit} disabled={submitting}>
        {submitting ? 'Sending…' : buttonLabel}
      </Button>
    </div>
  );
}
