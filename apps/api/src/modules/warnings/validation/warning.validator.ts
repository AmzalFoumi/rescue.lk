import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  VerifiedHazardReportDto,
  WarningFormErrors,
} from '@rescue-lk/shared';
import type { HazardReportSummary } from '../hazard-report-lookup/hazard-report-lookup.interface.js';
import type { WarningForm } from '../domain/warning-form.js';
import { TARGET_AREA_CATALOG } from '../target-areas/target-area-catalog.interface.js';
import type { TargetAreaCatalog } from '../target-areas/target-area-catalog.interface.js';
import { InvalidWarningException } from '../exceptions/invalid-warning.exception.js';
import { ReportNotVerifiedException } from '../exceptions/report-not-verified.exception.js';
import { WARNING_RULES, type ValidationMode } from './warning.rules.js';

// Parameter Object for one validation run.
export interface WarningValidationRequest {
  form: WarningForm;
  report: HazardReportSummary;
  mode: ValidationMode;
}

// WarningValidator decides whether a warning may be saved (DRAFT) or published
// (PUBLISH), and that a cancel has a reason (sequence diagram step 8.2).
// SRP: it only validates. Field types and maximum lengths are already checked by the
// request DTOs; the business rules themselves are entries in WARNING_RULES.
// OCP: it loops over the rule list, so a new rule never changes this class.
// DIP: it depends on the TargetAreaCatalog interface to check area ids.
// It reports every invalid field at once (InvalidWarningException), not just the first.
@Injectable()
export class WarningValidator {
  private readonly logger = new Logger(WarningValidator.name);

  constructor(
    @Inject(TARGET_AREA_CATALOG) private readonly areas: TargetAreaCatalog,
  ) {}

  validate({ form, report, mode }: WarningValidationRequest): void {
    this.assertReportVerified(report);

    const errors = this.collectErrors(form, mode);
    if (Object.keys(errors).length > 0) {
      this.logger.warn(
        `${mode} warning for hazard report ${report.id} rejected: ${Object.keys(errors).join(', ')}`,
      );
      throw new InvalidWarningException(errors);
    }
  }

  // Cancelling an ACTIVE warning needs a reason; returns it trimmed.
  requireCancelReason(reason: string): string {
    const cancelReason = reason.trim();
    if (!cancelReason) {
      this.logger.warn('Cancel refused: no reason given');
      throw new InvalidWarningException({
        cancelReason: 'Give a reason for cancelling.',
      });
    }
    return cancelReason;
  }

  // OCP: loops over WARNING_RULES, so a new rule needs no change here. Every failing
  // field is collected, not just the first, so the officer sees all errors at once.
  private collectErrors(
    form: WarningForm,
    mode: ValidationMode,
  ): WarningFormErrors {
    const errors: WarningFormErrors = {};
    for (const rule of WARNING_RULES) {
      const error = rule.modes.includes(mode)
        ? rule.check({ form, areas: this.areas })
        : null;
      if (error) {
        errors[rule.field] = error;
      }
    }
    return errors;
  }

  // alt [invalid]: only reports verified in UC2 may have a warning, in both modes.
  private assertReportVerified(
    report: HazardReportSummary,
  ): asserts report is VerifiedHazardReportDto {
    if (report.status !== 'verified') {
      this.logger.warn(
        `Hazard report ${report.id} is ${report.status}; warning not saved`,
      );
      throw new ReportNotVerifiedException(report.id, report.status);
    }
  }
}
