import type { AnalyticsFilters } from '../domain/analytics-filters.js';

export function matchesDistrict(
  district: string,
  filters: AnalyticsFilters,
): boolean {
  return !filters.district || district === filters.district;
}

export function matchesHazard(
  hazard: string,
  filters: AnalyticsFilters,
): boolean {
  return !filters.hazardType || hazard === filters.hazardType;
}
