import { Injectable } from '@nestjs/common';
import type { TargetAreaDto } from '@rescue-lk/shared';
import type { TargetAreaCatalog } from './target-area-catalog.interface.js';

const SRI_LANKA_DISTRICTS: readonly string[] = [
  'Ampara',
  'Anuradhapura',
  'Badulla',
  'Batticaloa',
  'Colombo',
  'Galle',
  'Gampaha',
  'Hambantota',
  'Jaffna',
  'Kalutara',
  'Kandy',
  'Kegalle',
  'Kilinochchi',
  'Kurunegala',
  'Mannar',
  'Matale',
  'Matara',
  'Monaragala',
  'Mullaitivu',
  'Nuwara Eliya',
  'Polonnaruwa',
  'Puttalam',
  'Ratnapura',
  'Trincomalee',
  'Vavuniya',
];

const districtAreaId = (district: string): string =>
  `D-${district.toUpperCase().replace(/\s+/g, '_')}`;

const DISTRICT_AREAS: readonly TargetAreaDto[] = SRI_LANKA_DISTRICTS.map(
  (district) => ({
    id: districtAreaId(district),
    kind: 'DISTRICT',
    name: `${district} District`,
    districts: [district],
  }),
);

// Main flood-prone river basins and the districts they flow through.
const RIVER_BASIN_AREAS: readonly TargetAreaDto[] = [
  {
    id: 'B-KELANI',
    kind: 'RIVER_BASIN',
    name: 'Kelani Ganga basin',
    districts: ['Nuwara Eliya', 'Kegalle', 'Gampaha', 'Colombo'],
  },
  {
    id: 'B-KALU',
    kind: 'RIVER_BASIN',
    name: 'Kalu Ganga basin',
    districts: ['Ratnapura', 'Kalutara'],
  },
  {
    id: 'B-GIN',
    kind: 'RIVER_BASIN',
    name: 'Gin Ganga basin',
    districts: ['Galle'],
  },
  {
    id: 'B-NILWALA',
    kind: 'RIVER_BASIN',
    name: 'Nilwala Ganga basin',
    districts: ['Matara'],
  },
  {
    id: 'B-MAHAWELI',
    kind: 'RIVER_BASIN',
    name: 'Mahaweli Ganga basin',
    districts: [
      'Nuwara Eliya',
      'Kandy',
      'Badulla',
      'Polonnaruwa',
      'Trincomalee',
    ],
  },
];

// InMemoryTargetAreaCatalog holds the districts and main flood-prone river basins as
// static reference data, until areas are stored in the database.
// Adapter (stub) for the TargetAreaCatalog port. LSP: any TargetAreaCatalog can
// replace it without changes to the classes that use it.
@Injectable()
export class InMemoryTargetAreaCatalog implements TargetAreaCatalog {
  private readonly areas = new Map<string, TargetAreaDto>(
    [...DISTRICT_AREAS, ...RIVER_BASIN_AREAS].map((area) => [area.id, area]),
  );

  findAll(): TargetAreaDto[] {
    return [...this.areas.values()].map((area) => ({
      ...area,
      districts: [...area.districts],
    }));
  }

  findUnknown(areaIds: readonly string[]): string[] {
    return areaIds.filter((id) => !this.areas.has(id));
  }

  resolveDistricts(areaIds: readonly string[]): string[] {
    const districts = areaIds.flatMap(
      (id) => this.areas.get(id)?.districts ?? [],
    );
    return [...new Set(districts)];
  }
}
