import { Injectable } from '@nestjs/common';
import type {
  CitizensReachedEntry,
  CitizensReachedPort,
} from '../ports/citizens-reached.port.js';
import type { AnalyticsFilters } from '../domain/analytics-filters.js';
import { matchesDistrict } from './stub-filters.js';

const ROWS: CitizensReachedEntry[] = [
  { district: 'Ratnapura', warnings: 4, citizensReached: 752209 },
  { district: 'Galle', warnings: 4, citizensReached: 675991 },
  { district: 'Kalutara', warnings: 3, citizensReached: 641965 },
  { district: 'Kegalle', warnings: 4, citizensReached: 616297 },
];

@Injectable()
export class StubCitizensReachedAdapter implements CitizensReachedPort {
  async findCitizensReached(
    filters: AnalyticsFilters,
  ): Promise<CitizensReachedEntry[]> {
    return ROWS.filter((r) => matchesDistrict(r.district, filters));
  }
}
