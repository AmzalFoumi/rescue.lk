import type { AnalyticsFilters } from '../domain/analytics-filters.js';

export const ALERT_TIMELINE_PORT = Symbol('ALERT_TIMELINE_PORT');

export interface AlertTimelineEntry {
  date: Date;
  warning: string;
  hazard: string;
  severity: string;
  district: string;
  citizensReached: number;
}

export interface AlertTimelinePort {
  findAlertTimeline(filters: AnalyticsFilters): Promise<AlertTimelineEntry[]>;
}
