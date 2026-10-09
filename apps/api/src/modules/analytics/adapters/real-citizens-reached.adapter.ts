import { Injectable } from '@nestjs/common';
import type {
  CitizensReachedEntry,
  CitizensReachedPort,
} from '../ports/citizens-reached.port.js';
import type { AnalyticsFilters } from '../domain/analytics-filters.js';
import { WarningDistrictReachReader } from './warning-district-reach.reader.js';

@Injectable()
export class RealCitizensReachedAdapter implements CitizensReachedPort {
  constructor(private readonly reachReader: WarningDistrictReachReader) {}

  async findCitizensReached(
    filters: AnalyticsFilters,
  ): Promise<CitizensReachedEntry[]> {
    const rows = await this.reachReader.readPublishedWarningReach(filters);

    const map = new Map<string, { warnings: Set<string>; reach: number }>();

    for (const row of rows) {
      if (!map.has(row.district)) {
        map.set(row.district, { warnings: new Set(), reach: 0 });
      }
      const entry = map.get(row.district)!;
      entry.warnings.add(row.warning);
      entry.reach += row.citizensReached;
    }

    const result: CitizensReachedEntry[] = [];
    for (const [district, data] of map.entries()) {
      result.push({
        district,
        warnings: data.warnings.size,
        citizensReached: data.reach,
      });
    }

    return result.sort((a, b) => b.citizensReached - a.citizensReached); // Largest reach first
  }
}
