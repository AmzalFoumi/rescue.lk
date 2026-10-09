import { useState } from 'react';
import {
  composeRejectionReason,
  REJECT_REASONS,
  validateRejection,
  type RejectReasonValue,
} from '../domain/reject-reasons';
import { Button } from './Button';
import { ErrorText } from './ErrorText';
import { CARD_CLASS, INPUT_CLASS } from './tone-classes';

interface DecisionPanelProps {
  /** True while a decision is being sent. */
  pending: boolean;
  /** Why the last decision failed, if it did (for example 409: already decided). */
  error: string | null;
  onVerify: () => void;
  /** Called with the text to store as the rejection reason. */
  onReject: (reason: string) => void;
}

/** The operator's decision: verify, or reject with a reason. Use `key={report.id}` so it starts empty per report. */
export function DecisionPanel({
  pending,
  error,
  onVerify,
  onReject,
}: DecisionPanelProps) {
  const [reason, setReason] = useState<RejectReasonValue | ''>('');
  const [note, setNote] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  const handleReject = () => {
    const problem = validateRejection(reason, note);
    setReasonError(problem);
    if (problem === null && reason !== '') {
      onReject(composeRejectionReason(reason, note));
    }
  };

  return (
    <section className={`${CARD_CLASS} space-y-3`}>
      <h3 className="font-semibold">Validity review</h3>
      <div>
        <label
          htmlFor="reject-reason"
          className="mb-1 block text-sm font-semibold"
        >
          Rejection reason (required only to reject)
        </label>
        <select
          id="reject-reason"
          value={reason}
          onChange={(event) =>
            setReason(event.target.value as RejectReasonValue | '')
          }
          aria-invalid={reasonError !== null}
          className={INPUT_CLASS}
        >
          <option value="">Choose a reason</option>
          {REJECT_REASONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="reject-note"
          className="mb-1 block text-sm font-semibold"
        >
          Details for the citizen
        </label>
        <textarea
          id="reject-note"
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className={INPUT_CLASS}
        />
      </div>
      {reasonError && <ErrorText>{reasonError}</ErrorText>}
      {error && (
        <p
          role="alert"
          className="rounded-[10px] border border-danger-bd bg-danger-bg p-3 text-danger-fg"
        >
          {error}
        </p>
      )}
      <p className="text-sm text-ink-muted">
        Your decision is recorded with your name and the time. The citizen sees
        it in My Reports.
      </p>
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="danger" onClick={handleReject} disabled={pending}>
          Reject
        </Button>
        <Button onClick={onVerify} disabled={pending}>
          Verify and make available
        </Button>
      </div>
    </section>
  );
}
