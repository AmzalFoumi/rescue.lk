import type { AnalyticsFilters } from '../domain/analytics-filters.js';

export const CITIZENS_REACHED_PORT = Symbol('CITIZENS_REACHED_PORT');

export interface CitizensReachedEntry {
  district: string;
  warnings: number;
  citizensReached: number;
}

export interface CitizensReachedPort {
  findCitizensReached(
    filters: AnalyticsFilters,
  ): Promise<CitizensReachedEntry[]>;
}
