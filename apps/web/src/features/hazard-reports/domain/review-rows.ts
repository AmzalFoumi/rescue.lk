import type { DistrictDto } from '@rescue-lk/shared';
import { formatCoordinates, formatDateTime } from './format';
import { hazardTitle } from './hazard-types';
import type { ReportDraft, WizardStep } from './report-draft';

export interface ReviewRow {
  label: string;
  value: string;
  /** The step to go back to when the reporter presses Edit. Rows that cannot be edited have none. */
  editStep?: WizardStep;
}

function describeDraftLocation(
  draft: ReportDraft,
  districts: readonly DistrictDto[],
): string {
  const { location } = draft;
  if (location === null) return 'Not set';
  if (location.source === 'gps') {
    return `${formatCoordinates(location.fix.latitude, location.fix.longitude)} (GPS)`;
  }
  const district =
    districts.find((candidate) => candidate.id === location.districtId)?.name ??
    'Unknown district';
  return `${location.landmark.trim()}, ${district} (entered manually)`;
}

/** The lines of the "Review and submit" screen. */
export function buildReviewRows(
  draft: ReportDraft,
  districts: readonly DistrictDto[],
  capturedAt: Date,
): ReviewRow[] {
  return [
    {
      label: 'Hazard type',
      value: draft.hazardType
        ? hazardTitle(draft.hazardType, draft.otherHazard.trim())
        : 'Not chosen',
      editStep: 1,
    },
    {
      label: 'Location',
      value: describeDraftLocation(draft, districts),
      editStep: 2,
    },
    { label: 'Description', value: draft.description.trim(), editStep: 2 },
    {
      label: 'Photo',
      value: draft.photo ? draft.photo.fileName : 'No photo',
      editStep: 3,
    },
    {
      label: 'Date and time',
      value: `${formatDateTime(capturedAt.toISOString())} (recorded automatically)`,
    },
  ];
}
