import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { HazardReportRecord } from './hazard-report-record.js';
import { HazardReportStatus, canChangeStatus } from './hazard-report-status.js';
import { HAZARD_REPORTS_REPOSITORY } from './hazard-reports.repository.interface.js';
import type { HazardReportsRepository } from './hazard-reports.repository.interface.js';

// Report ids are 24-character hex strings (MongoDB ObjectIds).
const REPORT_ID_FORMAT = /^[0-9a-f]{24}$/i;

/** What the operator decided about a report. */
interface VerificationDecision {
  status: HazardReportStatus.Verified | HazardReportStatus.Rejected;
  operatorId: string;
  rejectionReason?: string;
}

/** The "Verify Hazard Report" sequence diagram: list, select, verify, reject. */
@Injectable()
export class HazardReportVerificationService {
  private readonly logger = new Logger(HazardReportVerificationService.name);

  constructor(
    @Inject(HAZARD_REPORTS_REPOSITORY)
    private readonly repository: HazardReportsRepository,
  ) {}

  /** getPendingReports(): the reports waiting for verification. */
  listPending(): Promise<HazardReportRecord[]> {
    return this.repository.findByStatus(HazardReportStatus.PendingVerification);
  }

  /**
   * selectReport(reportId) and getStatus(): one report with its details and
   * status. A reporter can use it to track their own report.
   */
  async getById(id: string): Promise<HazardReportRecord> {
    // An id that cannot exist is "not found", not a server error.
    const report = REPORT_ID_FORMAT.test(id)
      ? await this.repository.findById(id)
      : null;
    if (!report) {
      throw this.notFound(id);
    }
    return report;
  }

  /** verifyReport(reportId) then setStatus(Verified). */
  verify(id: string, operatorId: string): Promise<HazardReportRecord> {
    return this.decide(id, { status: HazardReportStatus.Verified, operatorId });
  }

  /** rejectReport(reportId, reason) then setStatus(Rejected). */
  reject(
    id: string,
    operatorId: string,
    reason: string,
  ): Promise<HazardReportRecord> {
    return this.decide(id, {
      status: HazardReportStatus.Rejected,
      operatorId,
      rejectionReason: reason,
    });
  }

  private async decide(
    id: string,
    decision: VerificationDecision,
  ): Promise<HazardReportRecord> {
    const report = await this.getById(id);
    if (!canChangeStatus(report.status, decision.status)) {
      throw new ConflictException(
        `Only a pending report can be changed, this one is already ${report.status}`,
      );
    }
    const updated = await this.repository.updateStatus(id, {
      status: decision.status,
      verifiedBy: decision.operatorId,
      verifiedAt: new Date(),
      rejectionReason: decision.rejectionReason,
    });
    // The report was found a moment ago, so null here means it was deleted in between.
    if (!updated) {
      throw this.notFound(id);
    }
    this.logger.log(`Report ${id} is now ${decision.status}`);
    return updated;
  }

  private notFound(id: string): NotFoundException {
    return new NotFoundException(`Hazard report ${id} not found`);
  }
}
