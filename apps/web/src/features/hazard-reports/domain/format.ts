const MS_PER_MINUTE = 60 * 1000;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

/** A date and time like "7 Oct, 10:40". Pass a time zone to get the same text everywhere. */
export function formatDateTime(iso: string, timeZone?: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  });
}

/** How long ago something happened, like "56 min ago" or "2 h ago". */
export function formatAge(iso: string, now: Date): string {
  const minutes = Math.floor(
    (now.getTime() - new Date(iso).getTime()) / MS_PER_MINUTE,
  );
  if (minutes < 1) return 'just now';
  if (minutes < MINUTES_PER_HOUR) return `${minutes} min ago`;
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  if (hours < HOURS_PER_DAY) return `${hours} h ago`;
  return `${Math.floor(hours / HOURS_PER_DAY)} d ago`;
}

/** Coordinates for display, like "6.6828° N, 80.3992° E". */
export function formatCoordinates(latitude: number, longitude: number): string {
  const lat = `${Math.abs(latitude).toFixed(4)}° ${latitude >= 0 ? 'N' : 'S'}`;
  const lng = `${Math.abs(longitude).toFixed(4)}° ${longitude >= 0 ? 'E' : 'W'}`;
  return `${lat}, ${lng}`;
}
