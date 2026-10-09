import { Injectable } from '@nestjs/common';
import type {
  ShelterOccupancyEntry,
  ShelterOccupancyPort,
} from '../ports/shelter-occupancy.port.js';
import type { AnalyticsFilters } from '../domain/analytics-filters.js';
import { matchesDistrict } from './stub-filters.js';

const ROWS: ShelterOccupancyEntry[] = [
  { district: 'Colombo', shelters: 6, capacity: 500, occupied: 420 },
  { district: 'Kegalle', shelters: 5, capacity: 450, occupied: 410 },
];

@Injectable()
export class StubShelterOccupancyAdapter implements ShelterOccupancyPort {
  async findShelterOccupancy(
    filters: AnalyticsFilters,
  ): Promise<ShelterOccupancyEntry[]> {
    return ROWS.filter((r) => matchesDistrict(r.district, filters));
  }
}
