import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api-error';

export interface AsyncResource<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  // When data last arrived; null until the first successful load.
  updatedAt: Date | null;
  reload: () => void;
}

interface Settled<T> {
  data: T | null;
  error: ApiError | null;
  updatedAt: Date | null;
  // Which (loader, attempt) this result belongs to; loading is derived from it.
  load: (() => Promise<T>) | null;
  attempt: number;
}

// useAsyncResource is the one way UC1 loads data: it returns data, error, loading,
// updatedAt and reload().
// SRP + DRY: every data hook is built on it, so loading, error handling and reloading
// are written and tested once.
// Old data stays visible while reloading, so polling does not flicker.
// Callers pass a memoised loader, or null to load nothing (e.g. no warning chosen).
export function useAsyncResource<T>(
  load: (() => Promise<T>) | null,
): AsyncResource<T> {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T>>({
    data: null,
    error: null,
    updatedAt: null,
    load: null,
    attempt: 0,
  });

  useEffect(() => {
    if (!load) {
      return;
    }
    // Ignore a late answer from an old loader (the officer moved on, or the screen
    // closed), so stale data never overwrites newer data.
    let active = true;
    load().then(
      (data) => {
        if (active) {
          setSettled({
            data,
            error: null,
            updatedAt: new Date(),
            load,
            attempt,
          });
        }
      },
      (error: unknown) => {
        if (active) {
          setSettled((previous) => ({
            ...previous,
            error: ApiError.from(error),
            load,
            attempt,
          }));
        }
      },
    );
    return () => {
      active = false;
    };
  }, [load, attempt]);

  const reload = useCallback(() => setAttempt((count) => count + 1), []);

  const loading =
    load !== null && (settled.load !== load || settled.attempt !== attempt);
  return {
    data: load ? settled.data : null,
    error: load ? settled.error : null,
    updatedAt: load ? settled.updatedAt : null,
    loading,
    reload,
  };
}
