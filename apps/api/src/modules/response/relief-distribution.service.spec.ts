import { describe, beforeEach, it, expect, vi } from 'vitest';
import { ReliefItem } from './relief-distribution.js';
import { ReliefDistributionService } from './relief-distribution.service.js';
import type { ReliefDistributionsRepository } from './relief-distributions.repository.interface.js';
import {
  DISTRICT_ID,
  fakeReliefRepository,
  ngoOwner,
} from './response.test-data.js';

describe('ReliefDistributionService', () => {
  let service: ReliefDistributionService;
  let distributions: ReliefDistributionsRepository;

  beforeEach(() => {
    distributions = fakeReliefRepository();
    service = new ReliefDistributionService(distributions);
  });

  it('logs what was distributed, where, and by whom', async () => {
    const record = await service.log({
      item: ReliefItem.Medicine,
      quantity: 120,
      district: DISTRICT_ID,
      owner: ngoOwner,
    });

    expect(distributions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        item: ReliefItem.Medicine,
        quantity: 120,
        district: DISTRICT_ID,
        owner: ngoOwner,
        distributedAt: expect.any(Date),
      }),
    );
    expect(record.item).toBe(ReliefItem.Medicine);
  });

  it('stamps the time the supplies went out', async () => {
    const before = Date.now();

    const record = await service.log({
      item: ReliefItem.Water,
      quantity: 1,
      district: DISTRICT_ID,
      owner: ngoOwner,
    });

    expect(record.distributedAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('lists everything distributed', async () => {
    expect(await service.list()).toHaveLength(1);
    expect(distributions.findAll).toHaveBeenCalledWith(undefined);
  });

  it('lists only one district when asked', async () => {
    await service.list(DISTRICT_ID);

    expect(distributions.findAll).toHaveBeenCalledWith(DISTRICT_ID);
  });

  it('returns nothing when no supplies went out yet', async () => {
    vi.mocked(distributions.findAll).mockResolvedValue([]);

    expect(await service.list()).toEqual([]);
  });
});
