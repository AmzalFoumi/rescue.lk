import type { HazardReportStatus } from '@rescue-lk/shared';

/** Colour family of a status chip. Each tone has fg/bg/bd tokens in globals.css. */
export type StatusTone = 'neutral' | 'caution' | 'success' | 'danger';

export type StatusIconName =
  'cloud-off' | 'clock' | 'circle-check' | 'circle-x';

export interface StatusPresentation {
  label: string;
  tone: StatusTone;
  icon: StatusIconName;
}

/** How each report status looks. Colour is always paired with an icon and a label. */
export const STATUS_PRESENTATION: Record<
  HazardReportStatus,
  StatusPresentation
> = {
  pending_synchronisation: {
    label: 'Pending Synchronisation',
    tone: 'neutral',
    icon: 'cloud-off',
  },
  pending_verification: {
    label: 'Pending Verification',
    tone: 'caution',
    icon: 'clock',
  },
  verified: { label: 'Verified', tone: 'success', icon: 'circle-check' },
  rejected: { label: 'Rejected', tone: 'danger', icon: 'circle-x' },
};

export function statusLabel(status: HazardReportStatus): string {
  return STATUS_PRESENTATION[status].label;
}
