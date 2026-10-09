import { describe, it, expect } from 'vitest';
import { RealAlertTimelineAdapter } from './real-alert-timeline.adapter.js';
import type { WarningDistrictReachReader } from './warning-district-reach.reader.js';
import type { AnalyticsFilters } from '../domain/analytics-filters.js';

describe('RealAlertTimelineAdapter', () => {
  it('maps and sorts rows correctly', async () => {
    const reader = {
      readPublishedWarningReach: async () => [
        {
          date: new Date('2026-10-01T12:00:00Z'),
          warning: 'W-1',
          hazard: 'flood',
          severity: 'LOW',
          district: 'Colombo',
          citizensReached: 200,
        },
        {
          date: new Date('2026-10-02T12:00:00Z'),
          warning: 'W-2',
          hazard: 'landslide',
          severity: 'HIGH',
          district: 'Kegalle',
          citizensReached: 100,
        },
      ],
    } as unknown as WarningDistrictReachReader;

    const adapter = new RealAlertTimelineAdapter(reader);
    const result = await adapter.findAlertTimeline({} as AnalyticsFilters);

    expect(result).toHaveLength(2);
    // Newest first
    expect(result[0].warning).toBe('W-2');
    expect(result[0].district).toBe('Kegalle');
    expect(result[0].hazard).toBe('Landslide');
    expect(result[0].severity).toBe('High');

    expect(result[1].warning).toBe('W-1');
  });

  it('empty result', async () => {
    const reader = {
      readPublishedWarningReach: async () => [],
    } as unknown as WarningDistrictReachReader;
    const adapter = new RealAlertTimelineAdapter(reader);
    const result = await adapter.findAlertTimeline({} as AnalyticsFilters);
    expect(result).toHaveLength(0);
  });
});
