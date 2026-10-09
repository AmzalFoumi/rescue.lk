import { Injectable } from '@nestjs/common';
import type {
  ResourceDistributionEntry,
  ResourceDistributionPort,
} from '../ports/resource-distribution.port.js';
import type { AnalyticsFilters } from '../domain/analytics-filters.js';
import { matchesDistrict } from './stub-filters.js';

const ROWS: ResourceDistributionEntry[] = [
  {
    district: 'Kegalle',
    item: 'Water packs',
    ownerOrganisation: 'Red Cross',
    quantity: 530,
  },
  {
    district: 'Ratnapura',
    item: 'Dry rations',
    ownerOrganisation: 'DMC',
    quantity: 450,
  },
  {
    district: 'Colombo',
    item: 'Medicine kits',
    ownerOrganisation: 'Health Ministry',
    quantity: 280,
  },
];

@Injectable()
export class StubResourceDistributionAdapter implements ResourceDistributionPort {
  async findResourceDistribution(
    filters: AnalyticsFilters,
  ): Promise<ResourceDistributionEntry[]> {
    return ROWS.filter((r) => matchesDistrict(r.district, filters));
  }
}
