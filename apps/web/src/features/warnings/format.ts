import type { WarningDto } from '@rescue-lk/shared';
import { DISPLAY_TIME_ZONE } from './constants';
import { HAZARD_META } from './meta';

// format.ts turns data into the text officers read: dates in Sri Lanka time, counts,
// short ids, area names and hazard names.
// SRP + DRY: every screen formats through here, so the same value always reads the
// same way, and the formatters are created once.

const dateTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: DISPLAY_TIME_ZONE,
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const clock = new Intl.DateTimeFormat('en-GB', {
  timeZone: DISPLAY_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const count = new Intl.NumberFormat('en-GB');

// Characters of an id shown on screen; the full id stays in a tooltip.
const SHORT_ID_LENGTH = 6;

// "8 Oct, 17:30" in Sri Lanka time, or a dash when there is no date.
export const formatDateTime = (iso: string | null): string =>
  iso ? dateTime.format(new Date(iso)) : '—';

export const formatCount = (value: number): string => count.format(value);

// "17:30" in Sri Lanka time.
export const formatTime = (date: Date): string => clock.format(date);

// The hazard as officers read it: the typed name for OTHER, else the label.
export const hazardName = (
  warning: Pick<WarningDto, 'hazard' | 'otherHazard'>,
): string =>
  warning.hazard === 'OTHER' && warning.otherHazard
    ? warning.otherHazard
    : HAZARD_META[warning.hazard].label;

// "Kalu Ganga basin, Ratnapura District" from area ids.
export const areaSummary = (
  areaIds: readonly string[],
  areaNames: Record<string, string>,
): string =>
  areaIds.map((id) => areaNames[id] ?? id).join(', ') || 'No area yet';

// "W-34A6F0" for a warning, "R-0000A1" for a report.
export const shortId = (prefix: 'W' | 'R', id: string): string =>
  `${prefix}-${id.slice(-SHORT_ID_LENGTH).toUpperCase()}`;

// The cancel dialog's explanation of what cancelling means for citizens.
export const cancelDescription = (
  warning: Pick<WarningDto, 'hazard' | 'otherHazard' | 'areaIds'>,
  areaNames: Record<string, string>,
  districts: readonly string[],
): string =>
  `${hazardName(warning)} warning for ${areaSummary(warning.areaIds, areaNames)}. It will be removed from the Citizen App for ${districts.join(', ')}. This cannot be undone.`;
