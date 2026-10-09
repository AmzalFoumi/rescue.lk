import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';
import { StreamableFile } from '@nestjs/common';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: {
            getVisibleReportTypes: vi.fn(),
            generateReport: vi.fn(),
            exportReport: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(AnalyticsController);
    service = module.get(AnalyticsService);
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns visible report types', () => {
    vi.mocked(service.getVisibleReportTypes).mockReturnValue([
      'ALERT_TIMELINE',
    ]);
    expect(controller.getReportTypes('DMC_ADMIN')).toEqual(['ALERT_TIMELINE']);
  });

  it('generates report', async () => {
    const dto = {
      type: 'ALERT_TIMELINE' as const,
      from: '2020-01-01',
      to: '2020-01-02',
    };
    const result = {
      type: 'ALERT_TIMELINE' as const,
      description: '',
      columns: [],
      rows: [],
      generatedAt: '',
      filters: { from: '', to: '' },
    };
    vi.mocked(service.generateReport).mockResolvedValue(result);

    await expect(controller.generateReport(dto, 'DMC_ADMIN')).resolves.toEqual(
      result,
    );
  });

  it('exports report', async () => {
    const dto = {
      type: 'ALERT_TIMELINE' as const,
      format: 'CSV' as const,
      from: '2020-01-01',
      to: '2020-01-02',
    };
    vi.mocked(service.exportReport).mockResolvedValue({
      buffer: Buffer.from('test'),
      fileName: 'test.csv',
      contentType: 'text/csv',
    });

    const result = await controller.exportReport(dto, 'DMC_ADMIN');
    expect(result).toBeInstanceOf(StreamableFile);
  });
});
