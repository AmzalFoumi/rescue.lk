import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import {
  MISSING_ID,
  SHELTER_ID,
  fakeSheltersRepository,
  shelter,
} from './response.test-data.js';
import { ShelterOccupancyService } from './shelter-occupancy.service.js';
import type { SheltersRepository } from './shelters.repository.interface.js';

describe('ShelterOccupancyService', () => {
  let service: ShelterOccupancyService;
  let shelters: SheltersRepository;

  beforeEach(() => {
    shelters = fakeSheltersRepository();
    service = new ShelterOccupancyService(shelters);
  });

  describe('getById', () => {
    it('returns the shelter with its status', async () => {
      expect((await service.getById(SHELTER_ID)).id).toBe(SHELTER_ID);
    });

    it('throws NotFound for an unknown id', async () => {
      vi.mocked(shelters.findById).mockResolvedValue(null);
      await expect(service.getById(MISSING_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFound for a malformed id without asking the database', async () => {
      await expect(service.getById('abc')).rejects.toThrow(NotFoundException);
      expect(shelters.findById).not.toHaveBeenCalled();
    });
  });

  describe('changeOccupancy', () => {
    it('admits people and reports the new count', async () => {
      const result = await service.changeOccupancy(SHELTER_ID, 25);

      expect(shelters.changeOccupancy).toHaveBeenCalledWith(SHELTER_ID, 25);
      expect(result.currentOccupancy).toBe(125);
    });

    it('lets people leave with a negative number', async () => {
      await service.changeOccupancy(SHELTER_ID, -10);

      expect(shelters.changeOccupancy).toHaveBeenCalledWith(SHELTER_ID, -10);
    });

    it('refuses a change of nobody', async () => {
      await expect(service.changeOccupancy(SHELTER_ID, 0)).rejects.toThrow(
        BadRequestException,
      );
      expect(shelters.findById).not.toHaveBeenCalled();
    });

    it('blocks anyone being sent to a full shelter', async () => {
      vi.mocked(shelters.findById).mockResolvedValue(
        shelter({ capacity: 400, currentOccupancy: 400 }),
      );

      await expect(service.changeOccupancy(SHELTER_ID, 1)).rejects.toThrow(
        ConflictException,
      );
      expect(shelters.changeOccupancy).not.toHaveBeenCalled();
    });

    it('blocks more people than there are places left', async () => {
      vi.mocked(shelters.findById).mockResolvedValue(
        shelter({ capacity: 400, currentOccupancy: 380 }),
      );

      await expect(service.changeOccupancy(SHELTER_ID, 21)).rejects.toThrow(
        ConflictException,
      );
    });

    it('fills the last places exactly', async () => {
      vi.mocked(shelters.findById).mockResolvedValue(
        shelter({ capacity: 400, currentOccupancy: 380 }),
      );

      await service.changeOccupancy(SHELTER_ID, 20);

      expect(shelters.changeOccupancy).toHaveBeenCalledWith(SHELTER_ID, 20);
    });

    it('refuses to remove more people than the shelter holds', async () => {
      await expect(service.changeOccupancy(SHELTER_ID, -101)).rejects.toThrow(
        BadRequestException,
      );
    });

    // Two officers filling the last places at the same time.
    it('throws Conflict when the shelter changed during the write', async () => {
      vi.mocked(shelters.changeOccupancy).mockResolvedValue(null);

      await expect(service.changeOccupancy(SHELTER_ID, 10)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
