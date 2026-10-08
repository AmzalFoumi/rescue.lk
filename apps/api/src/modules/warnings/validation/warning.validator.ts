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

// Parameter object for one validation run.
export interface WarningValidationRequest {
  form: WarningForm;
  report: HazardReportSummary;
  mode: ValidationMode;
}

// Sequence diagram step 8.2 validateWarning: business rules only. Field types
// and maximum lengths are already enforced by the request DTOs.
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
