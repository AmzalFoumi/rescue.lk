import { describe, it, expect } from 'vitest';
import { ResourceDistributionGenerator } from './resource-distribution.generator.js';
import type { ResourceDistributionPort } from '../ports/resource-distribution.port.js';
import type { AnalyticsFilters } from '../domain/analytics-filters.js';

describe('ResourceDistributionGenerator', () => {
  it('generates report content correctly', async () => {
    const port: ResourceDistributionPort = {
      findResourceDistribution: async () => [
        {
          district: 'Colombo',
          item: 'Food',
          ownerOrganisation: 'Gov',
          quantity: 100,
        },
      ],
    };
    const generator = new ResourceDistributionGenerator(port);
    const content = await generator.generate({} as AnalyticsFilters);

    expect(content.title).toBe('Resource Distribution by District');
    expect(content.columns.map((c) => c.key)).toEqual([
      'district',
      'item',
      'ownerOrganisation',
      'quantity',
    ]);
    expect(content.rows).toHaveLength(1);
    expect(content.rows[0].district).toBe('Colombo');
    expect(content.rows[0].item).toBe('Food');
    expect(content.rows[0].ownerOrganisation).toBe('Gov');
    expect(content.rows[0].quantity).toBe(100);
  });

  it('empty source gives empty rows', async () => {
    const port: ResourceDistributionPort = {
      findResourceDistribution: async () => [],
    };
    const generator = new ResourceDistributionGenerator(port);
    const content = await generator.generate({} as AnalyticsFilters);
    expect(content.rows).toHaveLength(0);
  });
});
