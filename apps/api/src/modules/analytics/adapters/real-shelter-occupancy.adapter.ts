import { Injectable, Inject } from '@nestjs/common';
import type {
  ShelterOccupancyEntry,
  ShelterOccupancyPort,
} from '../ports/shelter-occupancy.port.js';
import type { AnalyticsFilters } from '../domain/analytics-filters.js';
import { SHELTERS_REPOSITORY } from '../../response/shelters.repository.interface.js';
import type { SheltersRepository } from '../../response/shelters.repository.interface.js';
import { DistrictNameResolver } from './district-name-resolver.js';
import { matchesDistrict } from './filter-predicates.js';

@Injectable()
export class RealShelterOccupancyAdapter implements ShelterOccupancyPort {
  constructor(
    @Inject(SHELTERS_REPOSITORY)
    private readonly sheltersRepo: SheltersRepository,
    private readonly districtResolver: DistrictNameResolver,
  ) {}

  async findShelterOccupancy(
    filters: AnalyticsFilters,
  ): Promise<ShelterOccupancyEntry[]> {
    // Note: Shelter occupancy is a current-state snapshot with no daily history.
    // So we ignore the date range filters.
    const all = await this.sheltersRepo.findAll();

    const mapped = all.map((s) => ({
      ...s,
      districtName: this.districtResolver.resolve(s.district),
    }));

    const filtered = mapped.filter((s) =>
      matchesDistrict(s.districtName, filters),
    );

    const grouped = new Map<
      string,
      { shelters: number; capacity: number; occupied: number }
    >();

    for (const s of filtered) {
      if (!grouped.has(s.districtName)) {
        grouped.set(s.districtName, { shelters: 0, capacity: 0, occupied: 0 });
      }
      const entry = grouped.get(s.districtName)!;
      entry.shelters += 1;
      entry.capacity += s.capacity;
      entry.occupied += s.currentOccupancy;
    }

    const result: ShelterOccupancyEntry[] = [];
    for (const [district, data] of grouped.entries()) {
      result.push({
        district,
        shelters: data.shelters,
        capacity: data.capacity,
        occupied: data.occupied,
      });
    }

    return result;
  }
}
