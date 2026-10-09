import { describe, it, expect } from 'vitest';
import { ShelterOccupancyGenerator } from './shelter-occupancy.generator.js';
import type { ShelterOccupancyPort } from '../ports/shelter-occupancy.port.js';
import type { AnalyticsFilters } from '../domain/analytics-filters.js';

describe('ShelterOccupancyGenerator', () => {
  it('generates report content correctly', async () => {
    const port: ShelterOccupancyPort = {
      findShelterOccupancy: async () => [
        { district: 'Colombo', shelters: 1, capacity: 100, occupied: 50 },
      ],
    };
    const generator = new ShelterOccupancyGenerator(port);
    const content = await generator.generate({} as AnalyticsFilters);

    expect(content.title).toBe('Shelter Occupancy');
    expect(content.columns.map((c) => c.key)).toEqual([
      'district',
      'shelters',
      'capacity',
      'occupied',
      'available',
      'status',
    ]);
    expect(content.rows).toHaveLength(1);
    expect(content.rows[0].district).toBe('Colombo');
    expect(content.rows[0].shelters).toBe(1);
    expect(content.rows[0].capacity).toBe(100);
    expect(content.rows[0].occupied).toBe(50);
    expect(content.rows[0].available).toBe(50);
    expect(content.rows[0].status).toBe('Available');
  });

  it.each([
    { occupied: 90, capacity: 100, expected: 'Critical', desc: 'exactly 0.9' },
    {
      occupied: 75,
      capacity: 100,
      expected: 'Near full',
      desc: 'exactly 0.75',
    },
    { occupied: 0, capacity: 0, expected: 'Unknown', desc: 'capacity = 0' },
    {
      occupied: 110,
      capacity: 100,
      expected: 'Critical',
      desc: 'over capacity',
    },
  ])(
    'determines shelter status correctly for $desc',
    async ({ occupied, capacity, expected }) => {
      const port: ShelterOccupancyPort = {
        findShelterOccupancy: async () => [
          { district: 'Colombo', shelters: 1, capacity, occupied },
        ],
      };
      const generator = new ShelterOccupancyGenerator(port);
      const content = await generator.generate({} as AnalyticsFilters);
      expect(content.rows[0].status).toBe(expected);
    },
  );

  it('ensures available is never negative', async () => {
    const port: ShelterOccupancyPort = {
      findShelterOccupancy: async () => [
        { district: 'Colombo', shelters: 1, capacity: 100, occupied: 150 },
      ],
    };
    const generator = new ShelterOccupancyGenerator(port);
    const content = await generator.generate({} as AnalyticsFilters);
    expect(content.rows[0].available).toBe(0);
  });

  it('empty source gives empty rows', async () => {
    const port: ShelterOccupancyPort = {
      findShelterOccupancy: async () => [],
    };
    const generator = new ShelterOccupancyGenerator(port);
    const content = await generator.generate({} as AnalyticsFilters);
    expect(content.rows).toHaveLength(0);
  });
});
