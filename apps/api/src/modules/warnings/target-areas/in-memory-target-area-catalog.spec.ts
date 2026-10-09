import { describe, beforeEach, it, expect } from 'vitest';
import { InMemoryTargetAreaCatalog } from './in-memory-target-area-catalog.js';

const SRI_LANKA_DISTRICT_COUNT = 25;
const RIVER_BASIN_COUNT = 5;

describe('InMemoryTargetAreaCatalog', () => {
  let catalog: InMemoryTargetAreaCatalog;

  beforeEach(() => {
    catalog = new InMemoryTargetAreaCatalog();
  });

  it('lists every district and river basin', () => {
    const areas = catalog.findAll();

    expect(areas.filter((area) => area.kind === 'DISTRICT')).toHaveLength(
      SRI_LANKA_DISTRICT_COUNT,
    );
    expect(areas.filter((area) => area.kind === 'RIVER_BASIN')).toHaveLength(
      RIVER_BASIN_COUNT,
    );
  });

  it('builds district ids from the district name', () => {
    expect(catalog.findUnknown(['D-COLOMBO', 'D-NUWARA_ELIYA'])).toEqual([]);
  });

  it('returns copies so callers cannot change the catalog', () => {
    catalog.findAll()[0].districts.push('Atlantis');

    expect(catalog.findAll()[0].districts).not.toContain('Atlantis');
  });

  it('reports the area ids it does not know', () => {
    expect(catalog.findUnknown(['B-KALU', 'D-ATLANTIS', 'X'])).toEqual([
      'D-ATLANTIS',
      'X',
    ]);
  });

  it('expands river basins into distinct district names', () => {
    expect(catalog.resolveDistricts(['B-KALU', 'D-RATNAPURA'])).toEqual([
      'Ratnapura',
      'Kalutara',
    ]);
  });

  it('ignores unknown area ids when resolving districts', () => {
    expect(catalog.resolveDistricts(['D-ATLANTIS', 'D-GALLE'])).toEqual([
      'Galle',
    ]);
  });
});
