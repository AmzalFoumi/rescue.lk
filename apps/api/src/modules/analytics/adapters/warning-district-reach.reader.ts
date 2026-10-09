import { Injectable, Inject } from '@nestjs/common';
import { WARNINGS_REPOSITORY } from '../../warnings/warnings.repository.interface.js';
import type { WarningsRepository } from '../../warnings/warnings.repository.interface.js';
import { DELIVERY_RECORDS_REPOSITORY } from '../../warnings/delivery-records.repository.interface.js';
import type { DeliveryRecordsRepository } from '../../warnings/delivery-records.repository.interface.js';
import { TARGET_AREA_CATALOG } from '../../warnings/target-areas/target-area-catalog.interface.js';
import type { TargetAreaCatalog } from '../../warnings/target-areas/target-area-catalog.interface.js';
import { REACH_ALLOCATION_STRATEGY } from './reach-allocation.strategy.js';
import type { ReachAllocationStrategy } from './reach-allocation.strategy.js';
import type {
  HazardType,
  WarningSeverity,
  WarningStatus,
} from '@rescue-lk/shared';
import type { AnalyticsFilters } from '../domain/analytics-filters.js';
import {
  isWithinRange,
  matchesDistrict,
  matchesHazard,
} from './filter-predicates.js';
import { WARNING_STATUSES } from '../../warnings/warnings.constants.js';

export interface WarningReachRow {
  date: Date;
  warning: string;
  hazard: HazardType;
  severity: WarningSeverity;
  district: string;
  citizensReached: number;
}

const PUBLISHED_STATUSES: WarningStatus[] = WARNING_STATUSES.filter(
  (s) => s !== 'DRAFT',
);

/**
 * Reads warnings, calculates reach allocation, and flattens into per-district rows.
 *
 * NOTE: The per-district reach split is an estimate using the chosen allocation
 * strategy. The per-warning total recipients is exact.
 * When multiple channels (SMS, PUSH) are used for one warning, we take the largest
 * single-channel recipient count to avoid double-counting people reached by both.
 */
@Injectable()
export class WarningDistrictReachReader {
  constructor(
    @Inject(WARNINGS_REPOSITORY)
    private readonly warningsRepo: WarningsRepository,
    @Inject(DELIVERY_RECORDS_REPOSITORY)
    private readonly deliveriesRepo: DeliveryRecordsRepository,
    @Inject(TARGET_AREA_CATALOG)
    private readonly targetAreaCatalog: TargetAreaCatalog,
    @Inject(REACH_ALLOCATION_STRATEGY)
    private readonly reachAllocation: ReachAllocationStrategy,
  ) {}

  async readPublishedWarningReach(
    filters: AnalyticsFilters,
  ): Promise<WarningReachRow[]> {
    const rows: WarningReachRow[] = [];
    const allWarnings = await this.warningsRepo.findAll();

    for (const warning of allWarnings) {
      if (!PUBLISHED_STATUSES.includes(warning.status)) continue;
      if (!matchesHazard(warning.hazard, filters)) continue;

      const date = warning.publishedAt ?? warning.createdAt;
      if (
        filters.from &&
        filters.to &&
        !isWithinRange(date, filters.from, filters.to)
      ) {
        continue;
      }

      const districts = this.targetAreaCatalog.resolveDistricts(
        warning.areaIds,
      );
      let maxRecipients = 0;
      for (let v = 1; v <= warning.version; v++) {
        const deliveryRecords = await this.deliveriesRepo.findByWarningVersion({
          warningId: warning.id,
          warningVersion: v,
        });

        for (const record of deliveryRecords) {
          if (record.recipients > maxRecipients) {
            maxRecipients = record.recipients;
          }
        }
      }

      const allocation = this.reachAllocation.allocate(
        maxRecipients,
        districts,
      );

      for (const district of districts) {
        if (!matchesDistrict(district, filters)) continue;

        rows.push({
          date,
          warning: warning.id,
          hazard: warning.hazard,
          severity: warning.severity,
          district,
          citizensReached: allocation.get(district) ?? 0,
        });
      }
    }
    return rows;
  }
}
