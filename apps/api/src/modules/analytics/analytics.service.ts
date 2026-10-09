import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type {
  DemoRole,
  ReportType,
  TabularReportData,
} from '@rescue-lk/shared/analytics/report.types';
import { CLOCK, type Clock } from './clock.js';
import type { AnalyticsFilters } from './domain/analytics-filters.js';
import type { ExportedReport } from './domain/exported-report.js';
import type { GenerateReportDto } from './dto/generate-report.dto.js';
import type { ExportReportDto } from './dto/export-report.dto.js';
import { ReportGeneratorRegistry } from './generators/report-generator.registry.js';
import { ReportExporterRegistry } from './exporters/report-exporter.registry.js';
import { ReportVisibilityPolicy } from './policies/report-visibility.policy.js';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly generators: ReportGeneratorRegistry,
    private readonly exporters: ReportExporterRegistry,
    private readonly visibility: ReportVisibilityPolicy,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  getVisibleReportTypes(role: DemoRole): readonly ReportType[] {
    return this.visibility.getVisibleReportTypes(role);
  }

  async generateReport(
    dto: GenerateReportDto,
    role: DemoRole,
  ): Promise<TabularReportData> {
    this.visibility.assertCanViewReport(role, dto.type);

    const filters = this.toFilters(dto);
    const content = await this.generators.get(dto.type).generate(filters);

    return {
      type: dto.type,
      ...content,
      generatedAt: this.clock.now().toISOString(),
      filters: {
        from: filters.from.toISOString(),
        to: filters.to.toISOString(),
        hazardType: filters.hazardType,
        district: filters.district,
      },
    };
  }

  async exportReport(
    dto: ExportReportDto,
    role: DemoRole,
  ): Promise<ExportedReport> {
    const report = await this.generateReport(dto, role);
    const exporter = this.exporters.get(dto.format);

    return {
      buffer: await exporter.export(report),
      fileName: `${report.type.toLowerCase().replaceAll('_', '-')}.${exporter.fileExtension}`,
      contentType: exporter.contentType,
    };
  }

  private toFilters(dto: GenerateReportDto): AnalyticsFilters {
    const from = new Date(dto.from);
    const to = new Date(dto.to);

    if (from > to) {
      throw new BadRequestException('From date cannot be after To date');
    }
    return { from, to, hazardType: dto.hazardType, district: dto.district };
  }
}
