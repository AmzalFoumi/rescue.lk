import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DUPLICATE_WINDOW_HOURS,
  DuplicateChecker,
} from './duplicate-checker.js';
import { HazardReportStatus, canChangeStatus } from './hazard-report-status.js';
import { HAZARD_REPORTS_REPOSITORY } from './hazard-reports.repository.interface.js';
import type { HazardReportsRepository } from './hazard-reports.repository.interface.js';
import { OFFLINE_REPORT_QUEUE } from './offline-report-queue.js';
import type { OfflineReportQueue, SyncResult } from './offline-report-queue.js';
import type { SubmitHazardReportDto } from './dto/submit-hazard-report.dto.js';
import type { HazardReportDocument } from './schemas/hazard-report.schema.js';

@Injectable()
export class HazardReportsService {
  private readonly duplicateChecker = new DuplicateChecker();

  constructor(
    @Inject(HAZARD_REPORTS_REPOSITORY)
    private readonly repository: HazardReportsRepository,
    @Inject(OFFLINE_REPORT_QUEUE)
    private readonly offlineQueue: OfflineReportQueue,
  ) {}

  health(): { status: string; module: string } {
    return { status: 'ok', module: 'hazard-reports' };
  }

  // submitReport(data): check for duplicates, then store as "Pending Verification".
  async submit(dto: SubmitHazardReportDto): Promise<HazardReportDocument> {
    const capturedAt = new Date(dto.capturedAt);
    const windowMs = DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000;
    const sameTypeNearInTime = await this.repository.findByTypeBetween(
      dto.hazardType,
      new Date(capturedAt.getTime() - windowMs),
      new Date(capturedAt.getTime() + windowMs),
    );

    // A duplicate is flagged, not rejected: the operator decides later.
    const possibleDuplicateOf = this.duplicateChecker.findDuplicateIds(
      { latitude: dto.latitude, longitude: dto.longitude, capturedAt },
      sameTypeNearInTime.map((r) => ({
        id: r.id,
        latitude: r.latitude,
        longitude: r.longitude,
        capturedAt: r.capturedAt,
      })),
    );

    return this.repository.create({
      ...dto,
      capturedAt,
      status: HazardReportStatus.PendingVerification,
      possibleDuplicateOf,
    });
  }

  // queueOffline(): used when there is no network. The report waits in the queue.
  queueOffline(dto: SubmitHazardReportDto): {
    status: HazardReportStatus;
    pendingCount: number;
  } {
    this.offlineQueue.enqueue(dto);
    return {
      status: HazardReportStatus.PendingSynchronisation,
      pendingCount: this.offlineQueue.pendingCount(),
    };
  }

  // syncWhenOnline(): send every queued report through the normal submit path.
  syncQueued(): Promise<SyncResult> {
    return this.offlineQueue.syncWhenOnline(async (dto) => {
      await this.submit(dto);
    });
  }

  // getPendingReports()
  listPending(): Promise<HazardReportDocument[]> {
    return this.repository.findByStatus(HazardReportStatus.PendingVerification);
  }

  // selectReport(reportId) and getStatus()
  async getById(id: string): Promise<HazardReportDocument> {
    const report = await this.repository.findById(id);
    if (!report) {
      throw new NotFoundException(`Hazard report ${id} not found`);
    }
    return report;
  }

  // verifyReport(reportId) then setStatus(Verified)
  verify(id: string, operatorId: string): Promise<HazardReportDocument> {
    return this.changeStatus(id, HazardReportStatus.Verified, operatorId);
  }

  // rejectReport(reportId, reason) then setStatus(Rejected)
  reject(
    id: string,
    operatorId: string,
    reason: string,
  ): Promise<HazardReportDocument> {
    return this.changeStatus(
      id,
      HazardReportStatus.Rejected,
      operatorId,
      reason,
    );
  }

  private async changeStatus(
    id: string,
    newStatus: HazardReportStatus,
    operatorId: string,
    rejectionReason?: string,
  ): Promise<HazardReportDocument> {
    const report = await this.getById(id);
    if (!canChangeStatus(report.status, newStatus)) {
      throw new ConflictException(
        `A report that is ${report.status} cannot become ${newStatus}`,
      );
    }
    const updated = await this.repository.updateStatus(id, {
      status: newStatus,
      verifiedBy: operatorId,
      verifiedAt: new Date(),
      rejectionReason,
    });
    // The report was found a moment ago, so null here means it was deleted in between.
    if (!updated) {
      throw new NotFoundException(`Hazard report ${id} not found`);
    }
    return updated;
  }
}
