import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  DeliveryRecordDto,
  WarningDeliveryResultDto,
  WarningDto,
  WarningStatus,
} from '@rescue-lk/shared';
import { WARNINGS_REPOSITORY } from './warnings.repository.interface.js';
import type {
  CreateWarningInput,
  WarningChanges,
  WarningRecord,
  WarningsRepository,
} from './warnings.repository.interface.js';
import { HAZARD_REPORT_LOOKUP } from './hazard-report-lookup/hazard-report-lookup.interface.js';
import type {
  HazardReportLookup,
  HazardReportSummary,
} from './hazard-report-lookup/hazard-report-lookup.interface.js';
import { CLOCK } from './domain/clock.js';
import type { Clock } from './domain/clock.js';
import type { WarningForm } from './domain/warning-form.js';
import type {
  CancelWarningCommand,
  SubmitWarningCommand,
  UpdateWarningCommand,
} from './domain/warning-commands.js';
import { WarningValidator } from './validation/warning.validator.js';
import type { ValidationMode } from './validation/warning.rules.js';
import { ChannelRegistry } from './channels/channel.registry.js';
import { WarningDeliveryService } from './delivery/warning-delivery.service.js';
import { HazardReportNotFoundException } from './exceptions/hazard-report-not-found.exception.js';
import {
  WarningStatusConflictException,
  type WarningAction,
} from './exceptions/warning-status-conflict.exception.js';
import { INITIAL_WARNING_VERSION } from './warnings.constants.js';
import { requireWarning } from './require-warning.js';
import {
  toDeliveryRecordDto,
  toWarningDeliveryResultDto,
  toWarningDto,
} from './warnings.mapper.js';

// Parameter Object for a guarded status-dependent change.
interface WarningTransition {
  warningId: string;
  action: WarningAction;
  requiredStatus: WarningStatus;
  changes: WarningChanges;
}

// Parameter Object for checking a form before anything is saved.
interface FormCheck {
  form: WarningForm;
  mode: ValidationMode;
}

// Parameter Object for a brand-new DRAFT or ACTIVE warning.
interface NewWarning {
  form: WarningForm;
  createdBy: string;
  status: WarningStatus;
  now: Date;
}

// WarningsService runs the UC1 lifecycle commands: save a draft, publish, update,
// cancel and retry a delivery (DRAFT -> ACTIVE -> CANCELLED).
// SRP: it only coordinates the commands. Validation is in WarningValidator, sending in
// WarningDeliveryService, and every read the screen needs is in WarningQueryService.
// DIP: every collaborator arrives through the constructor as an interface or DI token
// (repository, hazard report port, clock), so tests swap each one for a fake.
// Sequence diagram: this is the controller-facing service for steps 8 to 10.
@Injectable()
export class WarningsService {
  private readonly logger = new Logger(WarningsService.name);

  constructor(
    @Inject(WARNINGS_REPOSITORY)
    private readonly warningsRepository: WarningsRepository,
    @Inject(HAZARD_REPORT_LOOKUP)
    private readonly hazardReports: HazardReportLookup,
    private readonly validator: WarningValidator,
    private readonly channelRegistry: ChannelRegistry,
    private readonly deliveryService: WarningDeliveryService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  health(): { status: string; module: string } {
    return { status: 'ok', module: 'warnings' };
  }

  // Creates a draft, or edits one that is still a DRAFT. Nothing is sent.
  async saveDraft({
    form,
    createdBy,
    draftId,
  }: SubmitWarningCommand): Promise<WarningDto> {
    await this.checkForm({ form, mode: 'DRAFT' });
    const now = this.clock.now();
    const draft = draftId
      ? await this.transition({
          warningId: draftId,
          action: 'edit',
          requiredStatus: 'DRAFT',
          changes: { ...form, updatedAt: now },
        })
      : await this.warningsRepository.create(
          this.newWarning({ form, createdBy, status: 'DRAFT', now }),
        );
    this.logger.log(`Saved draft warning ${draft.id}`);
    return toWarningDto(draft);
  }

  // Sequence diagram steps 8-10: check the report, validate, save, deliver.
  async publish({
    form,
    createdBy,
    draftId,
  }: SubmitWarningCommand): Promise<WarningDeliveryResultDto> {
    await this.checkForm({ form, mode: 'PUBLISH' });
    const now = this.clock.now();
    const warning = draftId
      ? await this.transition({
          warningId: draftId,
          action: 'publish',
          requiredStatus: 'DRAFT',
          changes: { ...form, status: 'ACTIVE', publishedAt: now },
        })
      : await this.warningsRepository.create(
          this.newWarning({ form, createdBy, status: 'ACTIVE', now }),
        );
    this.logger.log(
      `Published warning ${warning.id} via ${warning.channels.join(', ')}`,
    );
    return this.deliver(warning);
  }

  // Changes an ACTIVE warning: a new version is saved and sent again.
  async update({
    warningId,
    content,
  }: UpdateWarningCommand): Promise<WarningDeliveryResultDto> {
    const existing = await requireWarning(this.warningsRepository, warningId);
    this.assertStatus(existing, 'ACTIVE', 'update');
    await this.checkForm({
      form: { ...content, sourceReportId: existing.sourceReportId },
      mode: 'PUBLISH',
    });

    const updated = await this.transition({
      warningId,
      action: 'update',
      requiredStatus: 'ACTIVE',
      changes: {
        ...content,
        version: existing.version + 1,
        updatedAt: this.clock.now(),
      },
    });
    this.logger.log(`Updated warning ${warningId} to v${updated.version}`);
    return this.deliver(updated);
  }

  async cancel({
    warningId,
    reason,
  }: CancelWarningCommand): Promise<WarningDto> {
    const existing = await requireWarning(this.warningsRepository, warningId);
    this.assertStatus(existing, 'ACTIVE', 'cancel');
    const cancelReason = this.validator.requireCancelReason(reason);

    const cancelled = await this.transition({
      warningId,
      action: 'cancel',
      requiredStatus: 'ACTIVE',
      changes: {
        status: 'CANCELLED',
        cancelledAt: this.clock.now(),
        cancelReason,
      },
    });
    this.logger.log(`Cancelled warning ${warningId}: ${cancelReason}`);
    return toWarningDto(cancelled);
  }

  async retryDelivery(recordId: string): Promise<DeliveryRecordDto> {
    return toDeliveryRecordDto(await this.deliveryService.retry(recordId));
  }

  // Fail fast: everything that can reject the form runs before anything is saved or
  // sent, so a rejected warning never leaves half-saved data.
  private async checkForm({ form, mode }: FormCheck): Promise<void> {
    const report = await this.findReportOrThrow(form.sourceReportId);
    this.validator.validate({ form, report, mode });
    if (mode === 'PUBLISH') {
      this.channelRegistry.resolve(form.channels);
    }
  }

  private newWarning({
    form,
    createdBy,
    status,
    now,
  }: NewWarning): CreateWarningInput {
    return {
      ...form,
      status,
      version: INITIAL_WARNING_VERSION,
      createdBy,
      createdAt: now,
      publishedAt: status === 'ACTIVE' ? now : null,
      updatedAt: null,
      cancelledAt: null,
      cancelReason: '',
    };
  }

  private async deliver(
    warning: WarningRecord,
  ): Promise<WarningDeliveryResultDto> {
    const deliveries = await this.deliveryService.deliver(warning);
    return toWarningDeliveryResultDto(warning, deliveries);
  }

  // Status guard: the repository writes only while the warning is still in
  // requiredStatus. If the guard fails (missing, or changed by someone else), it
  // answers why: 404 if missing, otherwise a 409 status conflict.
  private async transition({
    warningId,
    action,
    requiredStatus,
    changes,
  }: WarningTransition): Promise<WarningRecord> {
    const updated = await this.warningsRepository.update({
      id: warningId,
      expectedStatus: requiredStatus,
      changes,
    });
    if (updated) {
      return updated;
    }
    const current = await requireWarning(this.warningsRepository, warningId);
    return this.throwStatusConflict(current, requiredStatus, action);
  }

  // Status guard checked early, so an action on a warning in the wrong state fails
  // fast with a 409 before any validation or saving.
  private assertStatus(
    warning: WarningRecord,
    requiredStatus: WarningStatus,
    action: WarningAction,
  ): void {
    if (warning.status !== requiredStatus) {
      this.throwStatusConflict(warning, requiredStatus, action);
    }
  }

  private throwStatusConflict(
    warning: WarningRecord,
    requiredStatus: WarningStatus,
    action: WarningAction,
  ): never {
    this.logger.warn(
      `Refused to ${action} warning ${warning.id}: it is ${warning.status}`,
    );
    throw new WarningStatusConflictException({
      warningId: warning.id,
      action,
      currentStatus: warning.status,
      requiredStatus,
    });
  }

  // DIP: asks the HazardReportLookup port, so the UC2 stub can be swapped for the real
  // adapter without touching this class.
  private async findReportOrThrow(
    hazardReportId: string,
  ): Promise<HazardReportSummary> {
    const report = await this.hazardReports.findById(hazardReportId);
    if (!report) {
      this.logger.warn(`Hazard report ${hazardReportId} not found`);
      throw new HazardReportNotFoundException(hazardReportId);
    }
    return report;
  }
}
