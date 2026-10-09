import { Inject, Injectable } from '@nestjs/common';
import {
  CITIZENS_REACHED_PORT,
  type CitizensReachedPort,
} from '../ports/citizens-reached.port.js';
import type { AnalyticsFilters } from '../domain/analytics-filters.js';
import type { ReportContent } from '../domain/report-content.js';
import type { ReportGenerator } from './report-generator.interface.js';

@Injectable()
export class CitizensReachedGenerator implements ReportGenerator {
  readonly type = 'CITIZENS_REACHED' as const;

  constructor(
    @Inject(CITIZENS_REACHED_PORT) private readonly source: CitizensReachedPort,
  ) {}

  async generate(filters: AnalyticsFilters): Promise<ReportContent> {
    const entries = await this.source.findCitizensReached(filters);
    const total = entries.reduce((sum, e) => sum + e.citizensReached, 0);

    return {
      title: 'Citizens Reached',
      description: 'People notified by SMS and push, by district.',
      columns: [
        { key: 'district', label: 'District' },
        { key: 'warnings', label: 'Warnings', align: 'right' },
        { key: 'citizensReached', label: 'Citizens Reached', align: 'right' },
        { key: 'shareOfTotal', label: 'Share of Total', align: 'right' },
      ],
      rows: entries.map((e) => ({
        district: e.district,
        warnings: e.warnings,
        citizensReached: e.citizensReached,
        shareOfTotal:
          total > 0
            ? `${((e.citizensReached / total) * 100).toFixed(1)}%`
            : '0%',
      })),
    };
  }
}
