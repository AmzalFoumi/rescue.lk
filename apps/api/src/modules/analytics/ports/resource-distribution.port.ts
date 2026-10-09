import type { AnalyticsFilters } from '../domain/analytics-filters.js';

export const RESOURCE_DISTRIBUTION_PORT = Symbol('RESOURCE_DISTRIBUTION_PORT');

export interface ResourceDistributionEntry {
  district: string;
  item: string;
  ownerOrganisation: string;
  quantity: number;
}

export interface ResourceDistributionPort {
  findResourceDistribution(
    filters: AnalyticsFilters,
  ): Promise<ResourceDistributionEntry[]>;
}
