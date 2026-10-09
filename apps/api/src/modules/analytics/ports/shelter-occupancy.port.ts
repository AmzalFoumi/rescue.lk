import type { AnalyticsFilters } from '../domain/analytics-filters.js';

export const SHELTER_OCCUPANCY_PORT = Symbol('SHELTER_OCCUPANCY_PORT');

export interface ShelterOccupancyEntry {
  district: string;
  shelters: number;
  capacity: number;
  occupied: number;
}

export interface ShelterOccupancyPort {
  findShelterOccupancy(
    filters: AnalyticsFilters,
  ): Promise<ShelterOccupancyEntry[]>;
}
