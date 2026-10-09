'use client';
// A copy of the UC2 hook: each use case owns its folder, so neither owner can
// break the other's screens by changing a shared file.

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
  /** What this state was loaded for. When the screen asks for something else, the state is stale. */
  loadedFor: { load: () => Promise<T>; refreshKey: unknown };
}

/**
 * Loads data when the screen opens and gives back loading and error states.
 * `load` must keep the same identity between renders (wrap it in useCallback).
 * When `load` or `refreshKey` changes, the data is loaded again and shows as loading meanwhile.
 */
export function useAsyncData<T>(
  load: () => Promise<T>,
  refreshKey?: unknown,
): AsyncData<T> {
  const [state, setState] = useState<LoadState<T>>({
    data: null,
    loading: true,
    error: null,
    loadedFor: { load, refreshKey },
  });
  const [version, setVersion] = useState(0);

  const reload = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: null }));
    setVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    const loadedFor = { load, refreshKey };
    load()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null, loadedFor });
      })
      .catch((error: unknown) => {
        if (active)
          setState({
            data: null,
            loading: false,
            error: errorMessage(error),
            loadedFor,
          });
      });
    return () => {
      active = false;
    };
  }, [load, version, refreshKey]);

  const stale =
    state.loadedFor.load !== load || state.loadedFor.refreshKey !== refreshKey;
  if (stale) {
    return { data: null, loading: true, error: null, reload };
  }
  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    reload,
  };
}
