import { useCallback } from 'react';
import type { WarningDto, WarningStatus } from '@rescue-lk/shared';
import { api } from '@/lib/api';
import { useAsyncResource } from './useAsyncResource';

// useWarnings loads warnings, newest first; all of them when no status is given.
// DRY: built on useAsyncResource.
export function useWarnings(status?: WarningStatus) {
  const load = useCallback(() => api.warnings.list(status), [status]);
  return useAsyncResource<WarningDto[]>(load);
}
