import { Injectable } from '@nestjs/common';
import type {
  AlertTimelineEntry,
  AlertTimelinePort,
} from '../ports/alert-timeline.port.js';
import type { AnalyticsFilters } from '../domain/analytics-filters.js';
import { WarningDistrictReachReader } from './warning-district-reach.reader.js';
import { formatHazard, formatSeverity } from './enum-label.js';

@Injectable()
export class RealAlertTimelineAdapter implements AlertTimelinePort {
  constructor(private readonly reachReader: WarningDistrictReachReader) {}

  async findAlertTimeline(
    filters: AnalyticsFilters,
  ): Promise<AlertTimelineEntry[]> {
    const rows = await this.reachReader.readPublishedWarningReach(filters);

    return rows
      .map((r) => ({
        date: r.date,
        warning: r.warning,
        hazard: formatHazard(r.hazard),
        severity: formatSeverity(r.severity),
        district: r.district,
        citizensReached: r.citizensReached,
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Newest first
  }
}
