// Limits for deciding that two reports describe the same event.
export const DUPLICATE_RADIUS_METRES = 500;
export const DUPLICATE_WINDOW_HOURS = 24;

const EARTH_RADIUS_METRES = 6_371_000;

export interface ReportPlace {
  latitude: number;
  longitude: number;
  capturedAt: Date;
}

export interface KnownReport extends ReportPlace {
  id: string;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// Haversine formula: straight-line distance between two GPS points on the Earth.
export function distanceInMetres(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) *
      Math.cos(toRadians(b.latitude)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METRES * Math.asin(Math.sqrt(h));
}

// checkDuplicate(report) from the sequence diagram.
// The caller passes reports of the same hazard type; we check place and time.
export class DuplicateChecker {
  findDuplicateIds(
    newReport: ReportPlace,
    knownReports: KnownReport[],
  ): string[] {
    const windowMs = DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000;
    return knownReports
      .filter((known) => {
        const closeInTime =
          Math.abs(
            newReport.capturedAt.getTime() - known.capturedAt.getTime(),
          ) < windowMs;
        const closeInSpace =
          distanceInMetres(newReport, known) <= DUPLICATE_RADIUS_METRES;
        return closeInTime && closeInSpace;
      })
      .map((known) => known.id);
  }
}
