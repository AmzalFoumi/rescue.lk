import { Inject, Injectable } from '@nestjs/common';
import {
  ALERT_TIMELINE_PORT,
  type AlertTimelinePort,
} from '../ports/alert-timeline.port.js';
import type { AnalyticsFilters } from '../domain/analytics-filters.js';
import type { ReportContent } from '../domain/report-content.js';
import type { ReportGenerator } from './report-generator.interface.js';

@Injectable()
export class AlertTimelineGenerator implements ReportGenerator {
  readonly type = 'ALERT_TIMELINE' as const;

  constructor(
    @Inject(ALERT_TIMELINE_PORT) private readonly source: AlertTimelinePort,
  ) {}

  async generate(filters: AnalyticsFilters): Promise<ReportContent> {
    const entries = await this.source.findAlertTimeline(filters);

    return {
      title: 'Timeline of Alerts Issued',
      description: 'Warnings issued during the selected period.',
      columns: [
        { key: 'date', label: 'Date' },
        { key: 'warning', label: 'Warning' },
        { key: 'hazard', label: 'Hazard' },
        { key: 'severity', label: 'Severity' },
        { key: 'district', label: 'District' },
        { key: 'citizensReached', label: 'Citizens Reached', align: 'right' },
      ],
      rows: entries.map((e) => ({
        date: e.date.toISOString().slice(0, 10),
        warning: e.warning,
        hazard: e.hazard,
        severity: e.severity,
        district: e.district,
        citizensReached: e.citizensReached,
      })),
    };
  }
}
