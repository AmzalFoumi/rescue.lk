import { describe, it, expect, vi } from 'vitest';
import { DistrictsService } from './districts.service.js';
import type {
  DistrictRecord,
  DistrictsRepository,
} from './districts.repository.interface.js';

const colombo: DistrictRecord = {
  id: 'd1',
  name: 'Colombo',
  province: 'Western',
  latitude: 6.9271,
  longitude: 79.8612,
};

describe('DistrictsService', () => {
  it('returns the districts from the repository', async () => {
    const repository: DistrictsRepository = {
      findAll: vi.fn().mockResolvedValue([colombo]),
    };

    const result = await new DistrictsService(repository).list();

    expect(result).toEqual([colombo]);
  });

  it('returns an empty list when there are no districts yet', async () => {
    const repository: DistrictsRepository = {
      findAll: vi.fn().mockResolvedValue([]),
    };

    expect(await new DistrictsService(repository).list()).toEqual([]);
  });

  it('passes a storage error on to the caller', async () => {
    const repository: DistrictsRepository = {
      findAll: vi.fn().mockRejectedValue(new Error('db down')),
    };

    await expect(new DistrictsService(repository).list()).rejects.toThrow(
      'db down',
    );
  });
});
