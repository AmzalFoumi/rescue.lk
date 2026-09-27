import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { HazardReportsService } from './hazard-reports.service.js';
import {
  HAZARD_REPORTS_REPOSITORY,
  HazardReportsRepository,
} from './hazard-reports.repository.interface.js';

describe('HazardReportsService', () => {
  let service: HazardReportsService;
  const mockRepository: HazardReportsRepository = {
    findAll: vi.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HazardReportsService,
        { provide: HAZARD_REPORTS_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get(HazardReportsService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('reports health', () => {
    expect(service.health()).toEqual({ status: 'ok', module: 'hazard-reports' });
  });

  it('delegates findAll to the repository', async () => {
    await service.findAll();
    expect(mockRepository.findAll).toHaveBeenCalled();
  });
});
