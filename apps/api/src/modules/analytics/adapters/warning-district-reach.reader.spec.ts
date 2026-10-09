import { describe, it, expect } from 'vitest';
import { WarningDistrictReachReader } from './warning-district-reach.reader.js';
import { EqualSplitReachAllocation } from './reach-allocation.strategy.js';
import type { WarningsRepository } from '../../warnings/warnings.repository.interface.js';
import type { DeliveryRecordsRepository } from '../../warnings/delivery-records.repository.interface.js';
import type { TargetAreaCatalog } from '../../warnings/target-areas/target-area-catalog.interface.js';
import { buildWarning, buildDeliveryRecord } from './analytics.fixture.js';
import type { AnalyticsFilters } from '../domain/analytics-filters.js';

describe('WarningDistrictReachReader', () => {
  it('reads multi-district split, delivery-channel handling (takes largest), only published included', async () => {
    const warningsRepo: WarningsRepository = {
      findAll: async () => [
        buildWarning({
          id: 'w1',
          status: 'ACTIVE',
          version: 1,
          areaIds: ['B-KALU'],
          publishedAt: new Date('2026-10-01'),
          hazard: 'flood',
          severity: 'HIGH',
        }),
        buildWarning({
          id: 'w2',
          status: 'DRAFT',
          version: 1,
          areaIds: ['D-COL'],
          publishedAt: null,
        }),
        buildWarning({
          id: 'w3',
          status: 'CANCELLED',
          version: 2,
          areaIds: ['D-KGL'],
          publishedAt: new Date('2026-10-05'),
          hazard: 'landslide',
          severity: 'MEDIUM',
        }),
      ],
      create: async () => {
        throw new Error('Not implemented');
      },
      findById: async () => {
        throw new Error('Not implemented');
      },
      update: async () => {
        throw new Error('Not implemented');
      },
    };

    const deliveriesRepo: DeliveryRecordsRepository = {
      findByWarningVersion: async (query) => {
        if (query.warningId === 'w1') {
          return [
            buildDeliveryRecord({ recipients: 100 }),
            buildDeliveryRecord({ recipients: 250 }), // SMS vs PUSH, taking largest
          ];
        }
        if (query.warningId === 'w3') {
          return [buildDeliveryRecord({ recipients: 50 })];
        }
        return [];
      },
      create: async () => {
        throw new Error('Not implemented');
      },
      findById: async () => {
        throw new Error('Not implemented');
      },
      update: async () => {
        throw new Error('Not implemented');
      },
    };

    const targetAreaCatalog: TargetAreaCatalog = {
      resolveDistricts: (ids: readonly string[]) => {
        if (ids[0] === 'B-KALU') return ['Ratnapura', 'Kalutara'];
        if (ids[0] === 'D-KGL') return ['Kegalle'];
        return ['Colombo'];
      },
      findAll: () => [],
      findUnknown: () => [],
    };

    const strategy = new EqualSplitReachAllocation();
    const reader = new WarningDistrictReachReader(
      warningsRepo,
      deliveriesRepo,
      targetAreaCatalog,
      strategy,
    );

    const rows = await reader.readPublishedWarningReach({} as AnalyticsFilters);

    expect(rows).toHaveLength(3);

    const w1r = rows.find(
      (r) => r.warning === 'w1' && r.district === 'Ratnapura',
    );
    expect(w1r?.citizensReached).toBe(125); // 250 / 2

    const w1k = rows.find(
      (r) => r.warning === 'w1' && r.district === 'Kalutara',
    );
    expect(w1k?.citizensReached).toBe(125);

    const w3 = rows.find((r) => r.warning === 'w3');
    expect(w3?.district).toBe('Kegalle');
    expect(w3?.citizensReached).toBe(50);
  });

  it('warning without delivery records results in 0 reach', async () => {
    const warningsRepo: WarningsRepository = {
      findAll: async () => [
        buildWarning({
          id: 'w1',
          status: 'ACTIVE',
          version: 1,
          areaIds: ['D-COL'],
          publishedAt: new Date('2026-10-01'),
          hazard: 'flood',
          severity: 'HIGH',
        }),
      ],
      create: async () => {
        throw new Error();
      },
      findById: async () => {
        throw new Error();
      },
      update: async () => {
        throw new Error();
      },
    };
    const deliveriesRepo: DeliveryRecordsRepository = {
      findByWarningVersion: async () => [],
      create: async () => {
        throw new Error();
      },
      findById: async () => {
        throw new Error();
      },
      update: async () => {
        throw new Error();
      },
    };
    const targetAreaCatalog: TargetAreaCatalog = {
      resolveDistricts: () => ['Colombo'],
      findAll: () => [],
      findUnknown: () => [],
    };

    const reader = new WarningDistrictReachReader(
      warningsRepo,
      deliveriesRepo,
      targetAreaCatalog,
      new EqualSplitReachAllocation(),
    );
    const rows = await reader.readPublishedWarningReach({} as AnalyticsFilters);

    expect(rows).toHaveLength(1);
    expect(rows[0].citizensReached).toBe(0);
  });

  it('filters (district, hazard, date)', async () => {
    const warningsRepo: WarningsRepository = {
      findAll: async () => [
        buildWarning({
          id: 'w1',
          status: 'ACTIVE',
          areaIds: ['D-COL'],
          publishedAt: new Date('2026-10-01'),
          hazard: 'flood',
        }),
        buildWarning({
          id: 'w2',
          status: 'ACTIVE',
          areaIds: ['D-KGL'],
          publishedAt: new Date('2026-10-05'),
          hazard: 'landslide',
        }),
        buildWarning({
          id: 'w3',
          status: 'ACTIVE',
          areaIds: ['D-COL'],
          publishedAt: new Date('2026-10-10'),
          hazard: 'flood',
        }),
      ],
      create: async () => {
        throw new Error();
      },
      findById: async () => {
        throw new Error();
      },
      update: async () => {
        throw new Error();
      },
    };
    const deliveriesRepo: DeliveryRecordsRepository = {
      findByWarningVersion: async () => [],
      create: async () => {
        throw new Error();
      },
      findById: async () => {
        throw new Error();
      },
      update: async () => {
        throw new Error();
      },
    };
    const targetAreaCatalog: TargetAreaCatalog = {
      resolveDistricts: (ids: readonly string[]) => {
        if (ids[0] === 'D-COL') return ['Colombo'];
        return ['Kegalle'];
      },
      findAll: () => [],
      findUnknown: () => [],
    };

    const reader = new WarningDistrictReachReader(
      warningsRepo,
      deliveriesRepo,
      targetAreaCatalog,
      new EqualSplitReachAllocation(),
    );

    const rows = await reader.readPublishedWarningReach({
      district: 'Colombo',
      hazardType: 'flood',
      from: new Date('2026-09-01'),
      to: new Date('2026-10-05'),
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].warning).toBe('w1');
  });

  it('repository error propagates', async () => {
    const warningsRepo: WarningsRepository = {
      findAll: async () => {
        throw new Error('Repo Error');
      },
      create: async () => {
        throw new Error();
      },
      findById: async () => {
        throw new Error();
      },
      update: async () => {
        throw new Error();
      },
    };
    const deliveriesRepo: DeliveryRecordsRepository = {
      findByWarningVersion: async () => [],
      create: async () => {
        throw new Error();
      },
      findById: async () => {
        throw new Error();
      },
      update: async () => {
        throw new Error();
      },
    };
    const targetAreaCatalog: TargetAreaCatalog = {
      resolveDistricts: () => ['Colombo'],
      findAll: () => [],
      findUnknown: () => [],
    };

    const reader = new WarningDistrictReachReader(
      warningsRepo,
      deliveriesRepo,
      targetAreaCatalog,
      new EqualSplitReachAllocation(),
    );
    await expect(
      reader.readPublishedWarningReach({} as AnalyticsFilters),
    ).rejects.toThrow('Repo Error');
  });
});
