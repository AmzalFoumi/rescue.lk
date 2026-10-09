import { Inject, Injectable } from '@nestjs/common';
import type {
  DeliveryRecordDto,
  ReachEstimateDto,
  TargetAreaDto,
  VerifiedHazardReportDto,
  WarningDto,
  WarningStatus,
} from '@rescue-lk/shared';
import { WARNINGS_REPOSITORY } from './warnings.repository.interface.js';
import type { WarningsRepository } from './warnings.repository.interface.js';
import { DELIVERY_RECORDS_REPOSITORY } from './delivery-records.repository.interface.js';
import type { DeliveryRecordsRepository } from './delivery-records.repository.interface.js';
import { HAZARD_REPORT_LOOKUP } from './hazard-report-lookup/hazard-report-lookup.interface.js';
import type { HazardReportLookup } from './hazard-report-lookup/hazard-report-lookup.interface.js';
import { TARGET_AREA_CATALOG } from './target-areas/target-area-catalog.interface.js';
import type { TargetAreaCatalog } from './target-areas/target-area-catalog.interface.js';
import { ChannelRegistry } from './channels/channel.registry.js';
import { requireWarning } from './require-warning.js';
import { toDeliveryRecordDto, toWarningDto } from './warnings.mapper.js';

// WarningQueryService answers the read-only questions of the UC1 screen: the warning
// list, verified reports, target areas, the expected reach and the latest deliveries.
// SRP: it never changes data. Commands live in WarningsService, so a change to how
// warnings are published can never break a read, and the other way round.
// DIP: every source is an interface (repositories, HazardReportLookup,
// TargetAreaCatalog), so the UC2 stub or the database can be replaced without edits here.
@Injectable()
export class WarningQueryService {
  constructor(
    @Inject(WARNINGS_REPOSITORY)
    private readonly warningsRepository: WarningsRepository,
    @Inject(DELIVERY_RECORDS_REPOSITORY)
    private readonly deliveryRecordsRepository: DeliveryRecordsRepository,
    @Inject(HAZARD_REPORT_LOOKUP)
    private readonly hazardReports: HazardReportLookup,
    @Inject(TARGET_AREA_CATALOG) private readonly areas: TargetAreaCatalog,
    private readonly channelRegistry: ChannelRegistry,
  ) {}

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

  // Expected reach of a warning on every channel before it is sent, for the
  // "Target citizen summary" and the publish confirmation.
  estimateReach(areaIds: readonly string[]): ReachEstimateDto {
    const districts = this.areas.resolveDistricts(areaIds);
    return {
      districts,
      channels: this.channelRegistry.all().map((channel) => ({
        channel: channel.type,
        recipients: channel.estimateRecipients(districts),
      })),
    };
  }

  // Sequence diagram step 11: delivery status of the current version only.
  async latestDeliveries(warningId: string): Promise<DeliveryRecordDto[]> {
    const warning = await requireWarning(this.warningsRepository, warningId);
    const records = await this.deliveryRecordsRepository.findByWarningVersion({
      warningId,
      warningVersion: warning.version,
    });
    return records.map(toDeliveryRecordDto);
  }
}
