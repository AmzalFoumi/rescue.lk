import { UnprocessableEntityException } from '@nestjs/common';
import type { HazardReportStatus } from '@rescue-lk/shared';

// Sequence diagram alt [invalid]: getStatus() is not verified, so no warning may be issued.
export class ReportNotVerifiedException extends UnprocessableEntityException {
  constructor(hazardReportId: string, status: HazardReportStatus) {
    super(
      `Hazard report ${hazardReportId} is ${status}; warnings can only be issued for verified reports`,
    );
  }
}
