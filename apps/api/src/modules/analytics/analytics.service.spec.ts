import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { AnalyticsService } from './analytics.service.js';
import { ReportGeneratorRegistry } from './generators/report-generator.registry.js';
import { ReportExporterRegistry } from './exporters/report-exporter.registry.js';
import { ReportVisibilityPolicy } from './policies/report-visibility.policy.js';
import { CLOCK } from './clock.js';
import { BadRequestException } from '@nestjs/common';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let generators: ReportGeneratorRegistry;
  let exporters: ReportExporterRegistry;
  let visibility: ReportVisibilityPolicy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: ReportGeneratorRegistry, useValue: { get: vi.fn() } },
        { provide: ReportExporterRegistry, useValue: { get: vi.fn() } },
        {
          provide: ReportVisibilityPolicy,
          useValue: {
            getVisibleReportTypes: vi.fn(),
            assertCanViewReport: vi.fn(),
          },
        },
        {
          provide: CLOCK,
          useValue: { now: () => new Date('2026-01-01T00:00:00Z') },
        },
      ],
    }).compile();

    service = module.get(AnalyticsService);
    generators = module.get(ReportGeneratorRegistry);
    exporters = module.get(ReportExporterRegistry);
    visibility = module.get(ReportVisibilityPolicy);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('returns visible report types', () => {
    vi.mocked(visibility.getVisibleReportTypes).mockReturnValue([
      'ALERT_TIMELINE',
    ]);
    expect(service.getVisibleReportTypes('DMC_ADMIN')).toEqual([
      'ALERT_TIMELINE',
    ]);
  });

  it('generates report', async () => {
    const mockGenerator = {
      generate: vi
        .fn()
        .mockResolvedValue({ description: 'test', columns: [], rows: [] }),
    };
    vi.mocked(generators.get).mockReturnValue(mockGenerator as any);

    const result = await service.generateReport(
      { type: 'ALERT_TIMELINE', from: '2026-01-01', to: '2026-01-02' },
      'DMC_ADMIN',
    );
    expect(result.type).toBe('ALERT_TIMELINE');
    expect(result.generatedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('throws when from > to', async () => {
    await expect(
      service.generateReport(
        { type: 'ALERT_TIMELINE', from: '2026-01-02', to: '2026-01-01' },
        'DMC_ADMIN',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('exports report', async () => {
    const mockGenerator = {
      generate: vi
        .fn()
        .mockResolvedValue({ description: 'test', columns: [], rows: [] }),
    };
    vi.mocked(generators.get).mockReturnValue(mockGenerator as any);
    const mockExporter = {
      export: vi.fn().mockResolvedValue(Buffer.from('data')),
      fileExtension: 'csv',
      contentType: 'text/csv',
    };
    vi.mocked(exporters.get).mockReturnValue(mockExporter as any);

    const result = await service.exportReport(
      {
        type: 'ALERT_TIMELINE',
        format: 'CSV',
        from: '2026-01-01',
        to: '2026-01-02',
      },
      'DMC_ADMIN',
    );
    expect(result.fileName).toBe('alert-timeline.csv');
  });
});
