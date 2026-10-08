import { Inject, Injectable } from '@nestjs/common';
import type { HazardReportRecord } from './hazard-report-record.js';
import { HAZARD_REPORTS_REPOSITORY } from './hazard-reports.repository.interface.js';
import type { HazardReportsRepository } from './hazard-reports.repository.interface.js';

/** What a reporter does after submitting: look at the status of their reports. */
@Injectable()
export class HazardReportTrackingService {
  constructor(
    @Inject(HAZARD_REPORTS_REPOSITORY)
    private readonly repository: HazardReportsRepository,
  ) {}

  /** trackReportStatus(): every report sent by one reporter, newest first. */
  listByReporter(reporterId: string): Promise<HazardReportRecord[]> {
    return this.repository.findByReporter(reporterId);
  }
}
