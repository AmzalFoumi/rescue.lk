import { Inject, Injectable } from '@nestjs/common';
import { DISPATCHES_REPOSITORY } from './dispatches.repository.interface.js';
import type { DispatchesRepository } from './dispatches.repository.interface.js';
import { VERIFIED_REPORTS } from './verified-reports.port.js';
import type { VerifiedReportsPort } from './verified-reports.port.js';
import type { ResponseTarget } from './verified-report.js';

/**
 * Step 2 of Dispatch Rescue Team: the verified hazard reports that need a
 * response. A report that already has teams on it stays in the list, because
 * the officer may send more support (extension 8.a).
 */
@Injectable()
export class ResponseTargetsService {
  constructor(
    @Inject(VERIFIED_REPORTS)
    private readonly verifiedReports: VerifiedReportsPort,
    @Inject(DISPATCHES_REPOSITORY)
    private readonly dispatches: DispatchesRepository,
  ) {}

  async list(): Promise<ResponseTarget[]> {
    const reports = await this.verifiedReports.findVerified();
    const counts = await this.dispatches.countByReport(
      reports.map((report) => report.id),
    );
    return reports.map((report) => {
      const dispatchedTeams = counts[report.id] ?? 0;
      return {
        ...report,
        dispatchedTeams,
        needsResponse: dispatchedTeams === 0,
      };
    });
  }
}
