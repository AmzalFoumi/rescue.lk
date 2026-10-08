import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  DeliveryRecordDto,
  VerifiedHazardReportDto,
  WarningDeliveryResultDto,
  WarningDto,
} from '@rescue-lk/shared';
import { WARNINGS_REPOSITORY } from './warnings.repository.interface.js';
import type {
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
import { CLOCK } from './domain/clock.js';
import type { Clock } from './domain/clock.js';
import type { IssueWarningCommand } from './domain/issue-warning.command.js';
import { WarningValidator } from './validation/warning.validator.js';
import type { WarningValidationContext } from './validation/warning.rules.js';
import { ChannelRegistry } from './channels/channel.registry.js';
import { WarningDeliveryService } from './delivery/warning-delivery.service.js';
import { HazardReportNotFoundException } from './exceptions/hazard-report-not-found.exception.js';
import { WarningNotFoundException } from './exceptions/warning-not-found.exception.js';
import {
  toDeliveryRecordDto,
  toWarningDeliveryResultDto,
  toWarningDto,
} from './warnings.mapper.js';

// Coordinates UC1: each step delegates to a single-purpose collaborator.
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
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  health(): { status: string; module: string } {
    return { status: 'ok', module: 'warnings' };
  }

  // Sequence diagram steps 8-10: check the report, validate, create, deliver.
  async issueWarning(
    command: IssueWarningCommand,
  ): Promise<WarningDeliveryResultDto> {
    const report = await this.findReportOrThrow(command.hazardReportId);
    const now = this.clock.now();
    this.assertCanIssue({ command, report, now });

    const warning = await this.warningsRepository.create({
      ...command,
      issuedAt: now,
    });
    this.logger.log(
      `Issued warning ${warning.id} for hazard report ${report.id} via ${warning.channels.join(', ')}`,
    );

    const deliveries = await this.deliveryService.deliver(warning);
    return toWarningDeliveryResultDto(warning, deliveries);
  }

  // Feeds the report picker: only verified reports can be warned about.
  listVerifiedReports(): Promise<VerifiedHazardReportDto[]> {
    return this.hazardReports.findVerified();
  }

  async listWarnings(): Promise<WarningDto[]> {
    const warnings = await this.warningsRepository.findAll();
    return warnings.map(toWarningDto);
  }

  // Sequence diagram step 11: per-channel delivery status of a warning.
  async getDeliveries(warningId: string): Promise<DeliveryRecordDto[]> {
    await this.findWarningOrThrow(warningId);
    const records =
      await this.deliveryRecordsRepository.findByWarningId(warningId);
    return records.map(toDeliveryRecordDto);
  }

  // Everything that can reject the request runs before anything is saved or sent.
  private assertCanIssue(context: WarningValidationContext): void {
    this.validator.validate(context);
    this.channelRegistry.resolve(context.command.channels);
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
