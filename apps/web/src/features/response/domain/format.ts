import type { DistrictDto } from '@rescue-lk/shared';

/** Formatting shared by the UC3 screens. */

export function formatNumber(value: number): string {
  return value.toLocaleString('en-GB');
}

/** A whole percentage. Nothing out of nothing is 0%, never NaN. */
export function percentage(part: number, whole: number): string {
  if (whole <= 0) return '0%';
  return `${Math.round((part / whole) * 100)}%`;
}

/** The district name for an id, or the id when the districts are not loaded. */
export function districtName(id: string, districts: DistrictDto[]): string {
  return districts.find((district) => district.id === id)?.name ?? id;
}

/** "Riverside Road, Kandy", or just the district when no place was given. */
export function placeLabel(
  placeName: string | undefined,
  districtId: string,
  districts: DistrictDto[],
): string {
  const district = districtName(districtId, districts);
  return placeName ? `${placeName}, ${district}` : district;
}

/** A short date and time, e.g. "9 Oct, 14:05". */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** A date without the time, e.g. "9 Oct 2026". */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "2 teams", "1 team", "No team yet" — used in the incidents table. */
export function teamCountLabel(count: number): string {
  if (count === 0) return 'No team yet';
  return count === 1 ? '1 team' : `${count} teams`;
}
