'use client';

import { useState } from 'react';
import { Ban } from 'lucide-react';
import type { ApiError } from '@/lib/api-error';
import { CANCEL_REASON_MAX_LENGTH } from '../constants';
import { cx, ICON_SIZE, ui } from '../ui';
import { FieldError } from './FieldError';
import { Dialog } from './shell/Dialog';

interface CancelDialogProps {
  // "Cancel warning W-…?"
  title: string;
  // What cancelling means for citizens.
  description: string;
  pending: boolean;
  error: ApiError | null;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

const TITLE_ID = 'cancel-warning-title';
const REASON_ID = 'cancel-warning-reason';

// Asks for the (required) reason before an ACTIVE warning is cancelled.
// Rendered only while open, so the reason starts empty each time.
export function CancelDialog({
  title,
  description,
  pending,
  error,
  onConfirm,
  onClose,
}: CancelDialogProps) {
  const [reason, setReason] = useState('');
  const hasReason = reason.trim().length > 0;
  const message = error?.fieldErrors.cancelReason ?? error?.message;

  return (
    <Dialog titleId={TITLE_ID} onClose={onClose}>
      <form
        className="flex flex-col gap-3.5 p-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (hasReason) {
            onConfirm(reason.trim());
          }
        }}
      >
        <h2 id={TITLE_ID} className="text-[20px] font-bold">
          {title}
        </h2>
        <p className="text-[14px] leading-normal text-[#2E3A46]">
          {description}
        </p>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={REASON_ID} className={ui.label}>
            Reason for cancelling (required)
          </label>
          <textarea
            id={REASON_ID}
            rows={3}
            value={reason}
            required
            maxLength={CANCEL_REASON_MAX_LENGTH}
            onChange={(event) => setReason(event.target.value)}
            aria-invalid={message ? true : undefined}
            aria-describedby={message ? `${REASON_ID}-error` : undefined}
            className={cx(
              ui.input,
              'resize-y',
              message ? ui.inputInvalid : ui.inputBorder,
            )}
          />
          <FieldError id={`${REASON_ID}-error`} message={message} />
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className={ui.buttonSecondary}
          >
            Keep warning
          </button>
          <button
            type="submit"
            disabled={!hasReason || pending}
            title={hasReason ? undefined : 'Give a reason for cancelling first'}
            className={ui.buttonDanger}
          >
            <Ban aria-hidden size={ICON_SIZE.medium} />
            {pending ? 'Cancelling…' : 'Cancel warning'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
