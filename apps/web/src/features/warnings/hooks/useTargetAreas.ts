import type { TargetAreaDto } from '@rescue-lk/shared';
import { api } from '@/lib/api';
import { useAsyncResource } from './useAsyncResource';

const loadTargetAreas = () => api.warnings.targetAreas();

// useTargetAreas loads the districts and river basins a warning can target.
// DRY: built on useAsyncResource.
export function useTargetAreas() {
  return useAsyncResource<TargetAreaDto[]>(loadTargetAreas);
}
