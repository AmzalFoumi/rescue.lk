import { describe, it, expect, vi } from 'vitest';
import { DistrictsController } from './districts.controller.js';
import type { DistrictsService } from './districts.service.js';

describe('DistrictsController', () => {
  it('returns the districts from the service', async () => {
    const districts = [
      {
        id: 'd1',
        name: 'Colombo',
        province: 'Western',
        latitude: 6.9271,
        longitude: 79.8612,
      },
    ];
    const service = { list: vi.fn().mockResolvedValue(districts) };
    const controller = new DistrictsController(
      service as unknown as DistrictsService,
    );

    expect(await controller.list()).toEqual(districts);
  });
});
