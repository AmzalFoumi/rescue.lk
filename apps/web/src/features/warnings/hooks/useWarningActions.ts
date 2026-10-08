import { useCallback, useState } from 'react';
import { ApiError } from '@/lib/api-error';

export type WarningAction =
  'saveDraft' | 'publish' | 'update' | 'cancel' | 'retry';

export interface ActionFailure {
  action: WarningAction;
  error: ApiError;
}

// Runs one API action at a time, tracking which is pending and the last
// failure. A failure is kept (as an ApiError) for the UI to show, passed to
// onFailure, and run() resolves to null so the caller knows not to continue.
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
