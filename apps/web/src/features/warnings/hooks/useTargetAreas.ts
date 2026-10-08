import type { TargetAreaDto } from '@rescue-lk/shared';
import { api } from '@/lib/api';
import { useAsyncResource } from './useAsyncResource';

const loadTargetAreas = () => api.warnings.targetAreas();

// Districts and river basins a warning can target.
export function useTargetAreas() {
  return useAsyncResource<TargetAreaDto[]>(loadTargetAreas);
}
