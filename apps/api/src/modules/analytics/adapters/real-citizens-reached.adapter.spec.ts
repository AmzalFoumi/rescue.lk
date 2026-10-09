import { describe, it, expect } from 'vitest';
import { RealCitizensReachedAdapter } from './real-citizens-reached.adapter.js';
import type { WarningDistrictReachReader } from './warning-district-reach.reader.js';
import type { AnalyticsFilters } from '../domain/analytics-filters.js';

describe('RealCitizensReachedAdapter', () => {
  it('groups reach by district and sorts by largest reach first', async () => {
    const reader = {
      readPublishedWarningReach: async () => [
        {
          date: new Date('2026-10-02T12:00:00Z'),
          warning: 'W-2',
          hazard: 'flood',
          severity: 'HIGH',
          district: 'Colombo',
          citizensReached: 100,
        },
        {
          date: new Date('2026-10-01T12:00:00Z'),
          warning: 'W-1',
          hazard: 'flood',
          severity: 'LOW',
          district: 'Colombo',
          citizensReached: 200,
        },
        {
          date: new Date('2026-10-01T12:00:00Z'),
          warning: 'W-1',
          hazard: 'flood',
          severity: 'LOW',
          district: 'Kandy',
          citizensReached: 500,
        },
      ],
    } as unknown as WarningDistrictReachReader;

    const adapter = new RealCitizensReachedAdapter(reader);
    const result = await adapter.findCitizensReached({} as AnalyticsFilters);

    expect(result).toHaveLength(2);
    // Kandy has 500, Colombo has 300
    expect(result[0].district).toBe('Kandy');
    expect(result[0].warnings).toBe(1);
    expect(result[0].citizensReached).toBe(500);

    expect(result[1].district).toBe('Colombo');
    expect(result[1].warnings).toBe(2);
    expect(result[1].citizensReached).toBe(300);
  });

  it('empty result', async () => {
    const reader = {
      readPublishedWarningReach: async () => [],
    } as unknown as WarningDistrictReachReader;
    const adapter = new RealCitizensReachedAdapter(reader);
    const result = await adapter.findCitizensReached({} as AnalyticsFilters);
    expect(result).toHaveLength(0);
  });
});
