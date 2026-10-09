import type { DemoRole } from '@rescue-lk/shared/analytics/report.types';

export type AnalyticsTab =
  'overview' | 'alertsReach' | 'shelters' | 'resources' | 'reportGenerator';

export const TABS_BY_ROLE: Record<DemoRole, readonly AnalyticsTab[]> = {
  DMC_ADMIN: [
    'overview',
    'alertsReach',
    'shelters',
    'resources',
    'reportGenerator',
  ],
  DONOR_ORGANISATION: [
    'overview',
    'alertsReach',
    'resources',
    'reportGenerator',
  ],
};
