import { describe, it, expect } from 'vitest';
import { AlertTimelineGenerator } from './alert-timeline.generator.js';
import type { AlertTimelinePort } from '../ports/alert-timeline.port.js';
import type { AnalyticsFilters } from '../domain/analytics-filters.js';

describe('AlertTimelineGenerator', () => {
  it('generates report content correctly', async () => {
    const port: AlertTimelinePort = {
      findAlertTimeline: async () => [
        {
          date: new Date('2026-10-01T12:00:00Z'),
          warning: 'W1',
          hazard: 'Flood',
          severity: 'High',
          district: 'Colombo',
          citizensReached: 100,
        },
      ],
    };
    const generator = new AlertTimelineGenerator(port);
    const content = await generator.generate({} as AnalyticsFilters);

    expect(content.title).toBe('Timeline of Alerts Issued');
    expect(content.columns.map((c) => c.key)).toEqual([
      'date',
      'warning',
      'hazard',
      'severity',
      'district',
      'citizensReached',
    ]);
    expect(content.rows).toHaveLength(1);
    expect(content.rows[0].date).toBe('2026-10-01');
    expect(content.rows[0].warning).toBe('W1');
    expect(content.rows[0].hazard).toBe('Flood');
    expect(content.rows[0].severity).toBe('High');
    expect(content.rows[0].district).toBe('Colombo');
    expect(content.rows[0].citizensReached).toBe(100);
  });

  it('empty source gives empty rows', async () => {
    const port: AlertTimelinePort = {
      findAlertTimeline: async () => [],
    };
    const generator = new AlertTimelineGenerator(port);
    const content = await generator.generate({} as AnalyticsFilters);
    expect(content.rows).toHaveLength(0);
  });
});
