import { describe, it, expect } from 'vitest';
import {
  DistrictNameResolver,
  UNKNOWN_DISTRICT_NAME,
} from './district-name-resolver.js';
import type { DistrictsRepository } from '../../districts/districts.repository.interface.js';

describe('DistrictNameResolver', () => {
  const mockDistricts = [
    {
      id: '1',
      name: 'Colombo',
      province: 'Western',
      latitude: 0,
      longitude: 0,
    },
  ];

  it('resolves known id', async () => {
    const repo: DistrictsRepository = {
      findAll: async () => mockDistricts,
    };
    const resolver = new DistrictNameResolver(repo);
    await resolver.onModuleInit();

    expect(resolver.resolve('1')).toBe('Colombo');
  });

  it('unknown id returns UNKNOWN_DISTRICT_NAME', async () => {
    const repo: DistrictsRepository = {
      findAll: async () => mockDistricts,
    };
    const resolver = new DistrictNameResolver(repo);
    await resolver.onModuleInit();

    expect(resolver.resolve('99')).toBe(UNKNOWN_DISTRICT_NAME);
  });

  it('empty repo returns UNKNOWN_DISTRICT_NAME for anything', async () => {
    const repo: DistrictsRepository = {
      findAll: async () => [],
    };
    const resolver = new DistrictNameResolver(repo);
    await resolver.onModuleInit();

    expect(resolver.resolve('1')).toBe(UNKNOWN_DISTRICT_NAME);
  });

  it('repository rejects on init throws the error', async () => {
    const repo: DistrictsRepository = {
      findAll: async () => {
        throw new Error('DB Error');
      },
    };
    const resolver = new DistrictNameResolver(repo);

    await expect(resolver.onModuleInit()).rejects.toThrow('DB Error');
  });
});
