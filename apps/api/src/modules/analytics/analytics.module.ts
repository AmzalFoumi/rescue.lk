import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';
import { CLOCK, SystemClock } from './clock.js';
import { ReportVisibilityPolicy } from './policies/report-visibility.policy.js';

import { ALERT_TIMELINE_PORT } from './ports/alert-timeline.port.js';
import { CITIZENS_REACHED_PORT } from './ports/citizens-reached.port.js';
import { SHELTER_OCCUPANCY_PORT } from './ports/shelter-occupancy.port.js';
import { RESOURCE_DISTRIBUTION_PORT } from './ports/resource-distribution.port.js';
import { StubAlertTimelineAdapter } from './adapters/stub-alert-timeline.adapter.js';
import { StubCitizensReachedAdapter } from './adapters/stub-citizens-reached.adapter.js';
import { StubShelterOccupancyAdapter } from './adapters/stub-shelter-occupancy.adapter.js';
import { StubResourceDistributionAdapter } from './adapters/stub-resource-distribution.adapter.js';

import { RealAlertTimelineAdapter } from './adapters/real-alert-timeline.adapter.js';
import { RealCitizensReachedAdapter } from './adapters/real-citizens-reached.adapter.js';
import { RealShelterOccupancyAdapter } from './adapters/real-shelter-occupancy.adapter.js';
import { RealResourceDistributionAdapter } from './adapters/real-resource-distribution.adapter.js';

import {
  REACH_ALLOCATION_STRATEGY,
  EqualSplitReachAllocation,
} from './adapters/reach-allocation.strategy.js';
import { DistrictNameResolver } from './adapters/district-name-resolver.js';
import { WarningDistrictReachReader } from './adapters/warning-district-reach.reader.js';

import { WarningsModule } from '../warnings/warnings.module.js';
import { ResponseModule } from '../response/response.module.js';
import { DistrictsModule } from '../districts/districts.module.js';

import {
  REPORT_GENERATORS,
  type ReportGenerator,
} from './generators/report-generator.interface.js';
import { ReportGeneratorRegistry } from './generators/report-generator.registry.js';
import { AlertTimelineGenerator } from './generators/alert-timeline.generator.js';
import { CitizensReachedGenerator } from './generators/citizens-reached.generator.js';
import { ShelterOccupancyGenerator } from './generators/shelter-occupancy.generator.js';
import { ResourceDistributionGenerator } from './generators/resource-distribution.generator.js';

import {
  REPORT_EXPORTERS,
  type ReportExporter,
} from './exporters/report-exporter.interface.js';
import { ReportExporterRegistry } from './exporters/report-exporter.registry.js';
import { CsvReportExporter } from './exporters/csv-report.exporter.js';
import { PdfReportExporter } from './exporters/pdf-report.exporter.js';

@Module({
  imports: [WarningsModule, ResponseModule, DistrictsModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    ReportVisibilityPolicy,
    { provide: CLOCK, useClass: SystemClock },

    // Ports: swap `useClass` per source when a teammate's entity is ready.
    { provide: ALERT_TIMELINE_PORT, useClass: RealAlertTimelineAdapter },
    { provide: CITIZENS_REACHED_PORT, useClass: RealCitizensReachedAdapter },
    { provide: SHELTER_OCCUPANCY_PORT, useClass: RealShelterOccupancyAdapter },
    {
      provide: RESOURCE_DISTRIBUTION_PORT,
      useClass: RealResourceDistributionAdapter,
    },

    // Real adapter dependencies
    { provide: REACH_ALLOCATION_STRATEGY, useClass: EqualSplitReachAllocation },
    DistrictNameResolver,
    WarningDistrictReachReader,

    // Generators: a 5th report = new class + one line in this list.
    AlertTimelineGenerator,
    CitizensReachedGenerator,
    ShelterOccupancyGenerator,
    ResourceDistributionGenerator,
    {
      provide: REPORT_GENERATORS,
      useFactory: (...generators: ReportGenerator[]) => generators,
      inject: [
        AlertTimelineGenerator,
        CitizensReachedGenerator,
        ShelterOccupancyGenerator,
        ResourceDistributionGenerator,
      ],
    },
    ReportGeneratorRegistry,

    // Exporters: a new format = new class + one line in this list.
    CsvReportExporter,
    PdfReportExporter,
    {
      provide: REPORT_EXPORTERS,
      useFactory: (...exporters: ReportExporter[]) => exporters,
      inject: [CsvReportExporter, PdfReportExporter],
    },
    ReportExporterRegistry,
  ],
})
export class AnalyticsModule {}
