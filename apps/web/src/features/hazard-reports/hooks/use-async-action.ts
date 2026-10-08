'use client';

import { useCallback, useState } from 'react';
import { errorMessage } from '@/lib/api';

export interface AsyncAction<Args extends unknown[], Result> {
  /** Runs the action. Gives back undefined when it failed (the error is in `error`). */
  run: (...args: Args) => Promise<Result | undefined>;
  pending: boolean;
  error: string | null;
  clearError: () => void;
}

/** Wraps an async action (a button press) with pending and error state. */
export function useAsyncAction<Args extends unknown[], Result>(
  action: (...args: Args) => Promise<Result>,
): AsyncAction<Args, Result> {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (...args: Args) => {
      setPending(true);
      setError(null);
      try {
        return await action(...args);
      } catch (caught) {
        setError(errorMessage(caught));
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [action],
  );

  const clearError = useCallback(() => setError(null), []);

  return { run, pending, error, clearError };
}
