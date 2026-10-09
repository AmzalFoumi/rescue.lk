import { Inject, Injectable } from '@nestjs/common';
import {
  RESOURCE_DISTRIBUTION_PORT,
  type ResourceDistributionPort,
} from '../ports/resource-distribution.port.js';
import type { AnalyticsFilters } from '../domain/analytics-filters.js';
import type { ReportContent } from '../domain/report-content.js';
import type { ReportGenerator } from './report-generator.interface.js';

@Injectable()
export class ResourceDistributionGenerator implements ReportGenerator {
  readonly type = 'RESOURCE_DISTRIBUTION' as const;

  constructor(
    @Inject(RESOURCE_DISTRIBUTION_PORT)
    private readonly source: ResourceDistributionPort,
  ) {}

  async generate(filters: AnalyticsFilters): Promise<ReportContent> {
    const entries = await this.source.findResourceDistribution(filters);

    return {
      title: 'Resource Distribution by District',
      description:
        'Relief items distributed, by district and owner organisation.',
      columns: [
        { key: 'district', label: 'District' },
        { key: 'item', label: 'Item' },
        { key: 'ownerOrganisation', label: 'Owner Organisation' },
        { key: 'quantity', label: 'Quantity', align: 'right' },
      ],
      rows: entries.map((e) => ({
        district: e.district,
        item: e.item,
        ownerOrganisation: e.ownerOrganisation,
        quantity: e.quantity,
      })),
    };
  }
}
