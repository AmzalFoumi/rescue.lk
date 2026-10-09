import type { AnalyticsFilters } from '../domain/analytics-filters.js';

// In-memory filters for the prototype. These should move to repository-level queries later.

export function matchesDistrict(
  district: string,
  filters: AnalyticsFilters,
): boolean {
  return (
    !filters.district ||
    district.toLowerCase() === filters.district.toLowerCase()
  );
}

export function matchesHazard(
  hazard: string,
  filters: AnalyticsFilters,
): boolean {
  return (
    !filters.hazardType ||
    hazard.toLowerCase() === filters.hazardType.toLowerCase()
  );
}

export function isWithinRange(date: Date, from: Date, to: Date): boolean {
  // `to` is inclusive through the end of that day (UTC)
  const toEnd = new Date(to);
  toEnd.setUTCHours(23, 59, 59, 999);
  return date.getTime() >= from.getTime() && date.getTime() <= toEnd.getTime();
}
