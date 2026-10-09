import type { DemoRole } from '@rescue-lk/shared/analytics/report.types';

export const DEMO_ROLES = [
  'DMC_ADMIN',
  'DONOR_ORGANISATION',
] as const satisfies readonly DemoRole[];

export function isDemoRole(value: string): value is DemoRole {
  return (DEMO_ROLES as readonly string[]).includes(value);
}
