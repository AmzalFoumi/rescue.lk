'use client';

import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '@/lib/api';

export interface AsyncData<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Loads the data again. */
  reload: () => void;
}

interface LoadState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Loads data when the screen opens and gives back loading and error states.
 * `load` must keep the same identity between renders (wrap it in useCallback).
 * When `refreshKey` changes, the data is loaded again.
 */
export function useAsyncData<T>(
  load: () => Promise<T>,
  refreshKey?: unknown,
): AsyncData<T> {
  const [state, setState] = useState<LoadState<T>>({
    data: null,
    loading: true,
    error: null,
  });
  const [version, setVersion] = useState(0);

  const reload = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: null }));
    setVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    load()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (active)
          setState((current) => ({
            ...current,
            loading: false,
            error: errorMessage(error),
          }));
      });
    return () => {
      active = false;
    };
  }, [load, version, refreshKey]);

  return { ...state, reload };
}
