import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect } from 'vitest';
import { HazardReportsController } from './hazard-reports.controller.js';
import { HazardReportsService } from './hazard-reports.service.js';

describe('HazardReportsController', () => {
  let controller: HazardReportsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HazardReportsController],
      providers: [
        {
          provide: HazardReportsService,
          useValue: { health: () => ({ status: 'ok', module: 'hazard-reports' }) },
        },
      ],
    }).compile();

    controller = module.get(HazardReportsController);
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns health status', () => {
    expect(controller.health()).toEqual({ status: 'ok', module: 'hazard-reports' });
  });
});
