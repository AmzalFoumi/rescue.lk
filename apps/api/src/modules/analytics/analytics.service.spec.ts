import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect } from 'vitest';
import { AnalyticsService } from './analytics.service.js';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsService],
    }).compile();

    service = module.get(AnalyticsService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('reports health', () => {
    expect(service.health()).toEqual({ status: 'ok', module: 'analytics' });
  });
});
