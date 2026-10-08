import { UnprocessableEntityException } from '@nestjs/common';
import type { HazardReportStatus } from '@rescue-lk/shared';

// ReportNotVerifiedException (422): the source hazard report is not verified, so no
// warning may be issued from it (sequence diagram alt [invalid]).
// It extends a Nest HttpException, so the global AllExceptionsFilter maps it to the
// right status and no controller needs try/catch.
export class ReportNotVerifiedException extends UnprocessableEntityException {
  constructor(hazardReportId: string, status: HazardReportStatus) {
    super(
      `Hazard report ${hazardReportId} is ${status}; warnings can only be issued for verified reports`,
    );
  }
}
