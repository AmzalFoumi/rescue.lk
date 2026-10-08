import type { TargetAreaDto } from '@rescue-lk/shared';

// Port: the districts and river basins a warning can target. Reference data,
// so lookups are synchronous; a database-backed adapter can replace the stub.
export const TARGET_AREA_CATALOG = Symbol('TARGET_AREA_CATALOG');

export interface TargetAreaCatalog {
  findAll(): TargetAreaDto[];
  // The ids in areaIds that are not in the catalog.
  findUnknown(areaIds: readonly string[]): string[];
  // Distinct district names covered by the given areas (basins expand to districts).
  resolveDistricts(areaIds: readonly string[]): string[];
}
