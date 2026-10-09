import { Body, Controller, Get, Post, StreamableFile } from '@nestjs/common';
import type {
  DemoRole,
  ReportType,
  TabularReportData,
} from '@rescue-lk/shared/analytics/report.types';
import { AnalyticsService } from './analytics.service.js';
import { CurrentDemoRole } from './decorators/current-demo-role.decorator.js';
import { GenerateReportDto } from './dto/generate-report.dto.js';
import { ExportReportDto } from './dto/export-report.dto.js';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('report-types')
  getReportTypes(@CurrentDemoRole() role: DemoRole): readonly ReportType[] {
    return this.analytics.getVisibleReportTypes(role);
  }

  @Post('reports')
  generateReport(
    @Body() dto: GenerateReportDto,
    @CurrentDemoRole() role: DemoRole,
  ): Promise<TabularReportData> {
    return this.analytics.generateReport(dto, role);
  }

  @Post('reports/export')
  async exportReport(
    @Body() dto: ExportReportDto,
    @CurrentDemoRole() role: DemoRole,
  ): Promise<StreamableFile> {
    const exported = await this.analytics.exportReport(dto, role);

    return new StreamableFile(exported.buffer, {
      type: exported.contentType,
      disposition: `attachment; filename="${exported.fileName}"`,
    });
  }
}
