import { Inject, Injectable, Logger } from '@nestjs/common';
import { DuplicateChecker } from './duplicate-checker.js';
import type { HazardReportRecord } from './hazard-report-record.js';
import { HazardReportStatus } from './hazard-report-status.js';
import { HAZARD_REPORTS_REPOSITORY } from './hazard-reports.repository.interface.js';
import type { HazardReportsRepository } from './hazard-reports.repository.interface.js';
import { OFFLINE_REPORT_QUEUE } from './offline-report-queue.js';
import type { OfflineReportQueue, SyncResult } from './offline-report-queue.js';
import type { ReportSubmission } from './report-submission.js';

/** The "Submit Hazard Report" sequence diagram: submit, queue offline, sync. */
@Injectable()
export class HazardReportSubmissionService {
  private readonly logger = new Logger(HazardReportSubmissionService.name);

  constructor(
    @Inject(HAZARD_REPORTS_REPOSITORY)
    private readonly repository: HazardReportsRepository,
    @Inject(OFFLINE_REPORT_QUEUE)
    private readonly offlineQueue: OfflineReportQueue,
    @Inject(DuplicateChecker)
    private readonly duplicateChecker: DuplicateChecker,
  ) {}

  /**
   * submitReport(data): checks for duplicates, then stores the report as
   * "Pending Verification".
   */
  async submit(submission: ReportSubmission): Promise<HazardReportRecord> {
    const capturedAt = new Date(submission.capturedAt);
    const { from, to } = this.duplicateChecker.searchWindow(capturedAt);
    const sameTypeNearInTime = await this.repository.findByTypeBetween(
      submission.hazardType,
      from,
      to,
    );

    // A duplicate is flagged, not rejected: the operator decides later.
    const possibleDuplicateOf = this.duplicateChecker.findDuplicateIds(
      {
        latitude: submission.latitude,
        longitude: submission.longitude,
        capturedAt,
      },
      sameTypeNearInTime,
    );

    const report = await this.repository.create({
      ...submission,
      capturedAt,
      status: HazardReportStatus.PendingVerification,
      possibleDuplicateOf,
    });
    this.logger.log(
      `Report ${report.id} stored, ${possibleDuplicateOf.length} possible duplicate(s)`,
    );
    return report;
  }

  /**
   * queueOffline(): used when there is no network. The report waits in the
   * queue as "Pending Synchronisation" and is not stored yet.
   */
  queueOffline(submission: ReportSubmission): {
    status: HazardReportStatus;
    pendingCount: number;
  } {
    this.offlineQueue.enqueue(submission);
    const pendingCount = this.offlineQueue.pendingCount();
    this.logger.log(`Report queued offline, ${pendingCount} waiting`);
    return {
      status: HazardReportStatus.PendingSynchronisation,
      pendingCount,
    };
  }

  /**
   * syncWhenOnline(): sends every queued report through the normal submit
   * path. A report that fails stays queued.
   */
  async syncQueued(): Promise<SyncResult> {
    const result = await this.offlineQueue.syncWhenOnline(
      async (submission) => {
        await this.submit(submission);
      },
    );
    this.logger.log(
      `Sync finished: ${result.synced} stored, ${result.stillQueued} still queued`,
    );
    return result;
  }
}
