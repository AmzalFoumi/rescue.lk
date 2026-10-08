import { Button } from './Button';

type StateKind = 'loading' | 'error' | 'empty';

interface StateMessageProps {
  kind: StateKind;
  message?: string;
  /** For errors: shows a "Try again" button. */
  onRetry?: () => void;
}

const DEFAULT_MESSAGES: Record<StateKind, string> = {
  loading: 'Loading…',
  error: 'Something went wrong.',
  empty: 'Nothing here yet.',
};

/** The three states every list screen needs besides "has data". */
export function StateMessage({
  kind,
  message = DEFAULT_MESSAGES[kind],
  onRetry,
}: StateMessageProps) {
  if (kind === 'error') {
    return (
      <div
        role="alert"
        className="space-y-3 rounded-[10px] border border-danger-bd bg-danger-bg p-4 text-danger-fg"
      >
        <p>{message}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    );
  }
  return (
    <p
      role={kind === 'loading' ? 'status' : undefined}
      className="py-6 text-center text-ink-muted"
    >
      {message}
    </p>
  );
}
