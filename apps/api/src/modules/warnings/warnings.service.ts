import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  DeliveryRecordDto,
  TargetAreaDto,
  VerifiedHazardReportDto,
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
import { DELIVERY_RECORDS_REPOSITORY } from './delivery-records.repository.interface.js';
import type { DeliveryRecordsRepository } from './delivery-records.repository.interface.js';
import { HAZARD_REPORT_LOOKUP } from './hazard-report-lookup/hazard-report-lookup.interface.js';
import type {
  HazardReportLookup,
  HazardReportSummary,
} from './hazard-report-lookup/hazard-report-lookup.interface.js';
import { TARGET_AREA_CATALOG } from './target-areas/target-area-catalog.interface.js';
import type { TargetAreaCatalog } from './target-areas/target-area-catalog.interface.js';
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
import { InvalidWarningException } from './exceptions/invalid-warning.exception.js';
import { WarningNotFoundException } from './exceptions/warning-not-found.exception.js';
import {
  WarningStatusConflictException,
  type WarningAction,
} from './exceptions/warning-status-conflict.exception.js';
import { INITIAL_WARNING_VERSION } from './warnings.constants.js';
import {
  toDeliveryRecordDto,
  toWarningDeliveryResultDto,
  toWarningDto,
} from './warnings.mapper.js';

// Parameter object for a guarded status-dependent change.
interface WarningTransition {
  warningId: string;
  action: WarningAction;
  requiredStatus: WarningStatus;
  changes: WarningChanges;
}

// Parameter object for checking a form before anything is saved.
interface FormCheck {
  form: WarningForm;
  mode: ValidationMode;
}

// Parameter object for a brand-new DRAFT or ACTIVE warning.
interface NewWarning {
  form: WarningForm;
  createdBy: string;
  status: WarningStatus;
  now: Date;
}

// Coordinates UC1 (Facade over the use case): each step delegates to a
// single-purpose collaborator. Lifecycle: DRAFT -> ACTIVE -> CANCELLED.
@Injectable()
export class WarningsService {
  private readonly logger = new Logger(WarningsService.name);

  constructor(
    @Inject(WARNINGS_REPOSITORY)
    private readonly warningsRepository: WarningsRepository,
    @Inject(DELIVERY_RECORDS_REPOSITORY)
    private readonly deliveryRecordsRepository: DeliveryRecordsRepository,
    @Inject(HAZARD_REPORT_LOOKUP)
    private readonly hazardReports: HazardReportLookup,
    private readonly validator: WarningValidator,
    private readonly channelRegistry: ChannelRegistry,
    private readonly deliveryService: WarningDeliveryService,
    @Inject(TARGET_AREA_CATALOG) private readonly areas: TargetAreaCatalog,
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
    const existing = await this.findWarningOrThrow(warningId);
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
    const existing = await this.findWarningOrThrow(warningId);
    this.assertStatus(existing, 'ACTIVE', 'cancel');
    const cancelReason = reason.trim();
    if (!cancelReason) {
      throw new InvalidWarningException({
        cancelReason: 'Give a reason for cancelling.',
      });
    }

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

  async list(status?: WarningStatus): Promise<WarningDto[]> {
    const warnings = await this.warningsRepository.findAll(
      status ? { status } : {},
    );
    return warnings.map(toWarningDto);
  }

  // Feeds the report picker: only verified reports can be warned about.
  listVerifiedReports(): Promise<VerifiedHazardReportDto[]> {
    return this.hazardReports.findVerified();
  }

  // Feeds the "Affected area" step: every district and river basin.
  listTargetAreas(): TargetAreaDto[] {
    return this.areas.findAll();
  }

  // Sequence diagram step 11: delivery status of the current version only.
  async latestDeliveries(warningId: string): Promise<DeliveryRecordDto[]> {
    const warning = await this.findWarningOrThrow(warningId);
    const records = await this.deliveryRecordsRepository.findByWarningVersion({
      warningId,
      warningVersion: warning.version,
    });
    return records.map(toDeliveryRecordDto);
  }

  async retryDelivery(recordId: string): Promise<DeliveryRecordDto> {
    return toDeliveryRecordDto(await this.deliveryService.retry(recordId));
  }

  // Everything that can reject the form runs before anything is saved or sent.
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

  // Applies changes only while the warning is still in requiredStatus; if the
  // guard fails (missing, or changed by someone else), reports why.
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
    const current = await this.findWarningOrThrow(warningId);
    return this.throwStatusConflict(current, requiredStatus, action);
  }

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

  private async findWarningOrThrow(warningId: string): Promise<WarningRecord> {
    const warning = await this.warningsRepository.findById(warningId);
    if (!warning) {
      throw new WarningNotFoundException(warningId);
    }
    return warning;
  }
}
