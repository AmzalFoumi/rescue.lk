import type { HazardType } from '@rescue-lk/shared';

/** Names of the icons the UI draws (the components map each name to an icon). */
export type HazardIconName =
  'waves' | 'mountain' | 'construction' | 'flame' | 'circle-help';

export interface HazardTypeOption {
  value: HazardType;
  label: string;
  icon: HazardIconName;
}

/** The hazard types a reporter can choose from. Add a row to add a type. */
export const HAZARD_TYPE_OPTIONS: readonly HazardTypeOption[] = [
  { value: 'flood', label: 'Flood', icon: 'waves' },
  { value: 'landslide', label: 'Landslide', icon: 'mountain' },
  { value: 'road_blockage', label: 'Road Blockage', icon: 'construction' },
  { value: 'fire', label: 'Fire', icon: 'flame' },
  { value: 'other', label: 'Other', icon: 'circle-help' },
];

export function findHazardType(type: HazardType): HazardTypeOption {
  const option = HAZARD_TYPE_OPTIONS.find(
    (candidate) => candidate.value === type,
  );
  if (!option) {
    throw new Error(`Unknown hazard type: ${type}`);
  }
  return option;
}

/** The name shown for a report. "Other" reports show what the reporter typed. */
export function hazardTitle(type: HazardType, otherHazard?: string): string {
  if (type === 'other' && otherHazard) return otherHazard;
  return findHazardType(type).label;
}
