import { ForbiddenException, Injectable } from '@nestjs/common';
import type {
  DemoRole,
  ReportType,
} from '@rescue-lk/shared/analytics/report.types';

// Record<DemoRole, ...> forces every role to be listed (compile-time exhaustiveness).
const REPORTS_BY_ROLE: Record<DemoRole, readonly ReportType[]> = {
  DMC_ADMIN: [
    'ALERT_TIMELINE',
    'CITIZENS_REACHED',
    'SHELTER_OCCUPANCY',
    'RESOURCE_DISTRIBUTION',
  ],
  DONOR_ORGANISATION: ['CITIZENS_REACHED', 'RESOURCE_DISTRIBUTION'],
};

@Injectable()
export class ReportVisibilityPolicy {
  getVisibleReportTypes(role: DemoRole): readonly ReportType[] {
    return REPORTS_BY_ROLE[role];
  }

  assertCanViewReport(role: DemoRole, type: ReportType): void {
    if (!REPORTS_BY_ROLE[role].includes(type)) {
      throw new ForbiddenException(
        `Report type ${type} is not available for role ${role}`,
      );
    }
  }
}
