import { Injectable, Logger } from '@nestjs/common';
import type { VerifiedHazardReportDto } from '@rescue-lk/shared';
import type { HazardReportSummary } from '../hazard-report-lookup/hazard-report-lookup.interface.js';
import { InvalidWarningException } from '../exceptions/invalid-warning.exception.js';
import { ReportNotVerifiedException } from '../exceptions/report-not-verified.exception.js';
import {
  WARNING_RULES,
  type WarningValidationContext,
} from './warning.rules.js';

// Sequence diagram step 8.2 validateWarning: business rules only. Field formats
// (lengths, enums, ids) are already enforced by IssueWarningDto.
@Injectable()
export class WarningValidator {
  private readonly logger = new Logger(WarningValidator.name);

  validate(context: WarningValidationContext): void {
    this.assertReportVerified(context.report);

    const reasons = WARNING_RULES.map((rule) => rule(context)).filter(
      (reason): reason is string => reason !== null,
    );

    if (reasons.length > 0) {
      this.logger.warn(
        `Warning for hazard report ${context.report.id} rejected: ${reasons.join('; ')}`,
      );
      throw new InvalidWarningException(reasons);
    }
  }

  // alt [invalid]: only reports verified in UC2 may have a warning issued.
  private assertReportVerified(
    report: HazardReportSummary,
  ): asserts report is VerifiedHazardReportDto {
    if (report.status !== 'verified') {
      this.logger.warn(
        `Hazard report ${report.id} is ${report.status}; warning not issued`,
      );
      throw new ReportNotVerifiedException(report.id, report.status);
    }
  }
}
