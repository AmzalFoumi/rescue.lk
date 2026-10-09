import { describe, it, expect } from 'vitest';
import { RealShelterOccupancyAdapter } from './real-shelter-occupancy.adapter.js';
import type { SheltersRepository } from '../../response/shelters.repository.interface.js';
import type { DistrictNameResolver } from './district-name-resolver.js';
import type { AnalyticsFilters } from '../domain/analytics-filters.js';
import { buildShelter } from './analytics.fixture.js';

describe('RealShelterOccupancyAdapter', () => {
  it('groups and sums shelters by district', async () => {
    const repo: SheltersRepository = {
      findAll: async () => [
        buildShelter({
          id: '1',
          capacity: 100,
          currentOccupancy: 80,
          district: 'd1',
        }),
        buildShelter({
          id: '2',
          capacity: 50,
          currentOccupancy: 20,
          district: 'd1',
        }),
        buildShelter({
          id: '3',
          capacity: 200,
          currentOccupancy: 150,
          district: 'd2',
        }),
      ],
      findById: async () => null,
      changeOccupancy: async () => null,
    };

    const resolver = {
      resolve: (id: string) => (id === 'd1' ? 'Colombo' : 'Kandy'),
    } as unknown as DistrictNameResolver;

    const adapter = new RealShelterOccupancyAdapter(repo, resolver);

    const result = await adapter.findShelterOccupancy({} as AnalyticsFilters);

    expect(result).toHaveLength(2);

    const colombo = result.find((r) => r.district === 'Colombo');
    expect(colombo?.shelters).toBe(2);
    expect(colombo?.capacity).toBe(150);
    expect(colombo?.occupied).toBe(100);
  });

  it('empty result', async () => {
    const repo: SheltersRepository = {
      findAll: async () => [],
      findById: async () => null,
      changeOccupancy: async () => null,
    };
    const resolver = {
      resolve: () => 'Colombo',
    } as unknown as DistrictNameResolver;
    const adapter = new RealShelterOccupancyAdapter(repo, resolver);
    const result = await adapter.findShelterOccupancy({} as AnalyticsFilters);
    expect(result).toHaveLength(0);
  });

  it('filters that remove everything', async () => {
    const repo: SheltersRepository = {
      findAll: async () => [
        buildShelter({
          id: '1',
          capacity: 100,
          currentOccupancy: 80,
          district: 'd1',
        }),
      ],
      findById: async () => null,
      changeOccupancy: async () => null,
    };
    const resolver = {
      resolve: () => 'Colombo',
    } as unknown as DistrictNameResolver;
    const adapter = new RealShelterOccupancyAdapter(repo, resolver);
    const result = await adapter.findShelterOccupancy({
      district: 'Kandy',
    } as AnalyticsFilters);
    expect(result).toHaveLength(0);
  });
});
