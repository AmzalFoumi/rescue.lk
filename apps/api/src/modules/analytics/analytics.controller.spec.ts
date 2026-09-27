import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect } from 'vitest';
import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: AnalyticsService, useValue: { health: () => ({ status: 'ok', module: 'analytics' }) } },
      ],
    }).compile();

    controller = module.get(AnalyticsController);
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns health status', () => {
    expect(controller.health()).toEqual({ status: 'ok', module: 'analytics' });
  });
});
