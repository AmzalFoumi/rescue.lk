import { CircleAlert } from 'lucide-react';
import type { ApiError } from '@/lib/api-error';
import { cx, ICON_SIZE, ui } from '../ui';

interface ErrorNoticeProps {
  error: ApiError | null;
  // Extra line, e.g. how many fields need fixing.
  summary?: string;
  onRetry?: () => void;
}

// ErrorNotice shows a failed request (ApiError) with an optional retry button.
// Presentational. Errors are always shown, never swallowed; role=alert makes screen
// readers announce it as soon as it appears.
export function ErrorNotice({ error, summary, onRetry }: ErrorNoticeProps) {
  if (!error) {
    return null;
  }
  return (
    <div role="alert" className={ui.alert}>
      <CircleAlert aria-hidden size={ICON_SIZE.medium} className="mt-0.5" />
      <div className="flex-1">
        <p className="font-semibold">{error.message}</p>
        {summary && <p>{summary}</p>}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={cx(ui.buttonSecondary, 'px-2 py-1 text-[13px]')}
        >
          Try again
        </button>
      )}
    </div>
  );
}
