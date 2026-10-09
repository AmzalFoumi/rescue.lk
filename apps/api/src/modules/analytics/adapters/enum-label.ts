import { ReliefItem } from '../../response/relief-distribution.js';
import type { HazardType, WarningSeverity } from '@rescue-lk/shared';

function toTitleCase(value: string): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatReliefItem(item: ReliefItem): string {
  return toTitleCase(item);
}

export function formatHazard(hazard: HazardType): string {
  return toTitleCase(hazard);
}

export function formatSeverity(severity: WarningSeverity): string {
  return toTitleCase(severity);
}
