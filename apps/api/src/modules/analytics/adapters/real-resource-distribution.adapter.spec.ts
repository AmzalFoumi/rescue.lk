import { describe, it, expect } from 'vitest';
import { RealResourceDistributionAdapter } from './real-resource-distribution.adapter.js';
import type { ReliefDistributionsRepository } from '../../response/relief-distributions.repository.interface.js';
import type { DistrictNameResolver } from './district-name-resolver.js';
import type { AnalyticsFilters } from '../domain/analytics-filters.js';
import { buildReliefDistribution } from './analytics.fixture.js';

describe('RealResourceDistributionAdapter', () => {
  it('maps and filters distributions correctly', async () => {
    const repo: ReliefDistributionsRepository = {
      findAll: async () => [
        buildReliefDistribution({
          id: '1',
          district: 'd1',
          distributedAt: new Date('2026-10-01T12:00:00Z'),
        }),
        buildReliefDistribution({
          id: '2',
          district: 'd2',
          distributedAt: new Date('2026-10-02T12:00:00Z'),
        }),
      ],
      create: async () => {
        throw new Error('Not implemented');
      },
    };

    const resolver = {
      resolve: (id: string) => (id === 'd1' ? 'Colombo' : 'Kandy'),
    } as unknown as DistrictNameResolver;

    const adapter = new RealResourceDistributionAdapter(repo, resolver);

    const result = await adapter.findResourceDistribution({
      district: 'Colombo',
    } as AnalyticsFilters);

    expect(result).toHaveLength(1);
    expect(result[0].district).toBe('Colombo');
    expect(result[0].item).toBe('Food');
    expect(result[0].ownerOrganisation).toBe('Gov');
    expect(result[0].quantity).toBe(50);
  });

  it('empty result', async () => {
    const repo: ReliefDistributionsRepository = {
      findAll: async () => [],
      create: async () => {
        throw new Error('Not implemented');
      },
    };
    const resolver = {
      resolve: () => 'Colombo',
    } as unknown as DistrictNameResolver;
    const adapter = new RealResourceDistributionAdapter(repo, resolver);
    const result = await adapter.findResourceDistribution(
      {} as AnalyticsFilters,
    );
    expect(result).toHaveLength(0);
  });

  it('filters that remove everything', async () => {
    const repo: ReliefDistributionsRepository = {
      findAll: async () => [
        buildReliefDistribution({
          id: '1',
          district: 'd1',
          distributedAt: new Date('2026-10-01T12:00:00Z'),
        }),
      ],
      create: async () => {
        throw new Error('Not implemented');
      },
    };
    const resolver = {
      resolve: () => 'Colombo',
    } as unknown as DistrictNameResolver;
    const adapter = new RealResourceDistributionAdapter(repo, resolver);
    const result = await adapter.findResourceDistribution({
      district: 'Kandy',
    } as AnalyticsFilters);
    expect(result).toHaveLength(0);
  });

  it('filters by date range', async () => {
    const repo: ReliefDistributionsRepository = {
      findAll: async () => [
        buildReliefDistribution({
          id: '1',
          district: 'd1',
          distributedAt: new Date('2026-10-01T12:00:00Z'),
        }),
        buildReliefDistribution({
          id: '2',
          district: 'd2',
          distributedAt: new Date('2026-10-15T12:00:00Z'),
        }),
      ],
      create: async () => {
        throw new Error('Not implemented');
      },
    };
    const resolver = {
      resolve: () => 'Colombo',
    } as unknown as DistrictNameResolver;
    const adapter = new RealResourceDistributionAdapter(repo, resolver);
    const result = await adapter.findResourceDistribution({
      from: new Date('2026-09-01T00:00:00Z'),
      to: new Date('2026-10-05T00:00:00Z'),
    } as AnalyticsFilters);

    expect(result).toHaveLength(1);
  });
});
