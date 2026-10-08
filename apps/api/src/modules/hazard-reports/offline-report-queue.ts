import { Logger } from '@nestjs/common';
import type { ReportSubmission } from './report-submission.js';

export const OFFLINE_REPORT_QUEUE = Symbol('OFFLINE_REPORT_QUEUE');

export interface SyncResult {
  synced: number;
  stillQueued: number;
}

// OfflineReportQueue from the class diagram.
export interface OfflineReportQueue {
  enqueue(report: ReportSubmission): void;
  pendingCount(): number;
  syncWhenOnline(
    send: (report: ReportSubmission) => Promise<void>,
  ): Promise<SyncResult>;
}

// A mock queue that lives in memory. Reports are lost if the server restarts.
// The real queue would live on the reporter's phone.
export class InMemoryOfflineReportQueue implements OfflineReportQueue {
  private readonly logger = new Logger(InMemoryOfflineReportQueue.name);
  private queue: ReportSubmission[] = [];

  enqueue(report: ReportSubmission): void {
    this.queue.push(report);
  }

  pendingCount(): number {
    return this.queue.length;
  }

  // Tries to send every queued report. A report that fails stays queued for next time.
  async syncWhenOnline(
    send: (report: ReportSubmission) => Promise<void>,
  ): Promise<SyncResult> {
    const failed: ReportSubmission[] = [];
    let synced = 0;
    for (const report of this.queue) {
      try {
        await send(report);
        synced++;
      } catch (error) {
        // Keep the report for the next sync, but say why it failed.
        this.logger.warn(
          `Could not sync a queued report, it stays queued: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        failed.push(report);
      }
    }
    this.queue = failed;
    return { synced, stillQueued: failed.length };
  }
}
