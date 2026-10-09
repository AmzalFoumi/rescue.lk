import { describe, it, expect } from 'vitest';
import { CitizensReachedGenerator } from './citizens-reached.generator.js';
import type { CitizensReachedPort } from '../ports/citizens-reached.port.js';
import type { AnalyticsFilters } from '../domain/analytics-filters.js';

describe('CitizensReachedGenerator', () => {
  it('generates report content with correct keys and share calculation', async () => {
    const port: CitizensReachedPort = {
      findCitizensReached: async () => [
        { district: 'Colombo', warnings: 2, citizensReached: 80 },
        { district: 'Kandy', warnings: 1, citizensReached: 20 },
      ],
    };
    const generator = new CitizensReachedGenerator(port);
    const content = await generator.generate({} as AnalyticsFilters);

    expect(content.title).toBe('Citizens Reached');
    expect(content.columns.map((c) => c.key)).toEqual([
      'district',
      'warnings',
      'citizensReached',
      'shareOfTotal',
    ]);
    expect(content.rows).toHaveLength(2);
    expect(content.rows[0].district).toBe('Colombo');
    expect(content.rows[0].warnings).toBe(2);
    expect(content.rows[0].citizensReached).toBe(80);
    expect(content.rows[0].shareOfTotal).toBe('80.0%');

    expect(content.rows[1].district).toBe('Kandy');
    expect(content.rows[1].shareOfTotal).toBe('20.0%');
  });

  it('handles share-of-total with total 0', async () => {
    const port: CitizensReachedPort = {
      findCitizensReached: async () => [
        { district: 'Colombo', warnings: 1, citizensReached: 0 },
      ],
    };
    const generator = new CitizensReachedGenerator(port);
    const content = await generator.generate({} as AnalyticsFilters);
    expect(content.rows[0].shareOfTotal).toBe('0%');
  });

  it('empty source gives empty rows', async () => {
    const port: CitizensReachedPort = {
      findCitizensReached: async () => [],
    };
    const generator = new CitizensReachedGenerator(port);
    const content = await generator.generate({} as AnalyticsFilters);
    expect(content.rows).toHaveLength(0);
  });
});
