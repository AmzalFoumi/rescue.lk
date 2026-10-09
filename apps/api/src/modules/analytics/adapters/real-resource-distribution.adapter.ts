import { Injectable, Inject } from '@nestjs/common';
import type {
  ResourceDistributionEntry,
  ResourceDistributionPort,
} from '../ports/resource-distribution.port.js';
import type { AnalyticsFilters } from '../domain/analytics-filters.js';
import { RELIEF_DISTRIBUTIONS_REPOSITORY } from '../../response/relief-distributions.repository.interface.js';
import type { ReliefDistributionsRepository } from '../../response/relief-distributions.repository.interface.js';
import { DistrictNameResolver } from './district-name-resolver.js';
import { isWithinRange, matchesDistrict } from './filter-predicates.js';
import { formatReliefItem } from './enum-label.js';

@Injectable()
export class RealResourceDistributionAdapter implements ResourceDistributionPort {
  constructor(
    @Inject(RELIEF_DISTRIBUTIONS_REPOSITORY)
    private readonly distributionsRepo: ReliefDistributionsRepository,
    private readonly districtResolver: DistrictNameResolver,
  ) {}

  async findResourceDistribution(
    filters: AnalyticsFilters,
  ): Promise<ResourceDistributionEntry[]> {
    const all = await this.distributionsRepo.findAll();

    const mapped = all.map((d) => ({
      ...d,
      districtName: this.districtResolver.resolve(d.district),
    }));

    return mapped
      .filter((d) => matchesDistrict(d.districtName, filters))
      .filter(
        (d) =>
          !filters.from ||
          !filters.to ||
          isWithinRange(d.distributedAt, filters.from, filters.to),
      )
      .map((d) => ({
        district: d.districtName,
        item: formatReliefItem(d.item),
        ownerOrganisation: d.owner.name,
        quantity: d.quantity,
      }));
  }
}
