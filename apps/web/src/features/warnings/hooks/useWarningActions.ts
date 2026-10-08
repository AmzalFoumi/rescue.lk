import { useCallback, useState } from 'react';
import { ApiError } from '@/lib/api-error';

export type WarningAction =
  'saveDraft' | 'publish' | 'update' | 'cancel' | 'retry';

export interface ActionFailure {
  action: WarningAction;
  error: ApiError;
}

// useWarningActions runs one API action at a time and remembers which is pending.
// Errors are never swallowed: the last failure is kept as an ApiError for the UI,
// onFailure lets the caller react (e.g. show field errors), and run() resolves to null
// so the caller knows to stop.
// SRP + DRY: every save, publish, retry and cancel goes through it.
export function useWarningActions() {
  const [pending, setPending] = useState<WarningAction | null>(null);
  const [failure, setFailure] = useState<ActionFailure | null>(null);

  const run = useCallback(
    async <T>(
      action: WarningAction,
      call: () => Promise<T>,
      onFailure?: (error: ApiError) => void,
    ): Promise<T | null> => {
      setPending(action);
      setFailure(null);
      try {
        return await call();
      } catch (error) {
        const failure = ApiError.from(error);
        setFailure({ action, error: failure });
        onFailure?.(failure);
        return null;
      } finally {
        setPending(null);
      }
    },
    [],
  );

  const clearFailure = useCallback(() => setFailure(null), []);

  // The failure of one particular action, or null.
  const errorOf = useCallback(
    (...actions: WarningAction[]) =>
      failure && actions.includes(failure.action) ? failure.error : null,
    [failure],
  );

  return { pending, run, errorOf, clearFailure };
}
