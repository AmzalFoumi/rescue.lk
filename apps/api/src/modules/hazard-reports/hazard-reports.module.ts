import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HazardReportsController } from './hazard-reports.controller.js';
import { HazardReportsService } from './hazard-reports.service.js';
import { MongooseHazardReportsRepository } from './mongoose-hazard-reports.repository.js';
import { HAZARD_REPORTS_REPOSITORY } from './hazard-reports.repository.interface.js';
import {
  InMemoryOfflineReportQueue,
  OFFLINE_REPORT_QUEUE,
} from './offline-report-queue.js';
import {
  HazardReport,
  HazardReportSchema,
} from './schemas/hazard-report.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HazardReport.name, schema: HazardReportSchema },
    ]),
  ],
  controllers: [HazardReportsController],
  providers: [
    HazardReportsService,
    {
      provide: HAZARD_REPORTS_REPOSITORY,
      useClass: MongooseHazardReportsRepository,
    },
    { provide: OFFLINE_REPORT_QUEUE, useClass: InMemoryOfflineReportQueue },
  ],
})
export class HazardReportsModule {}
