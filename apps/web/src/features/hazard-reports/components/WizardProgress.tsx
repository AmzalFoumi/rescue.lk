import { TOTAL_STEPS, type WizardStep } from '../domain/report-draft';

/** "Step 2 of 4" with a progress bar. */
export function WizardProgress({ step }: { step: WizardStep }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-ink-muted">
        Step {step} of {TOTAL_STEPS}
      </p>
      <div
        role="progressbar"
        aria-label="Report progress"
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-valuenow={step}
        className="h-1.5 rounded-full bg-line"
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>
    </div>
  );
}
