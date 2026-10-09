import { Injectable } from '@nestjs/common';
import type {
  AlertTimelineEntry,
  AlertTimelinePort,
} from '../ports/alert-timeline.port.js';
import type { AnalyticsFilters } from '../domain/analytics-filters.js';
import { matchesDistrict, matchesHazard } from './stub-filters.js';

const ALERTS: AlertTimelineEntry[] = [
  {
    date: new Date('2026-10-07'),
    warning: 'W-202',
    hazard: 'Landslide',
    severity: 'Critical',
    district: 'Kegalle',
    citizensReached: 233160,
  },
  {
    date: new Date('2026-10-06'),
    warning: 'W-201',
    hazard: 'Flood',
    severity: 'High',
    district: 'Ratnapura',
    citizensReached: 302840,
  },
];

@Injectable()
export class StubAlertTimelineAdapter implements AlertTimelinePort {
  async findAlertTimeline(
    filters: AnalyticsFilters,
  ): Promise<AlertTimelineEntry[]> {
    return ALERTS.filter(
      (r) =>
        matchesDistrict(r.district, filters) &&
        matchesHazard(r.hazard, filters),
    );
  }
}
