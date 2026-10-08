import type { TargetAreaDto } from '@rescue-lk/shared';

// DI token for the TargetAreaCatalog port.
export const TARGET_AREA_CATALOG = Symbol('TARGET_AREA_CATALOG');

// TargetAreaCatalog lists the districts and river basins a warning can target, and
// expands a river basin into the districts it flows through.
// Port + DIP: the validator, the reach estimate and delivery depend on this interface,
// not on where the areas are stored.
// The areas are reference data, so lookups are synchronous; a database adapter can
// replace the in-memory stub later with a change only in warnings.module.ts.
export interface TargetAreaCatalog {
  findAll(): TargetAreaDto[];
  // The ids in areaIds that are not in the catalog.
  findUnknown(areaIds: readonly string[]): string[];
  // Distinct district names covered by the given areas (basins expand to districts).
  resolveDistricts(areaIds: readonly string[]): string[];
}
