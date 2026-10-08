import { Injectable } from '@nestjs/common';
import type { Location } from './location.js';

// Limits for deciding that two reports describe the same event.
export const DUPLICATE_RADIUS_METRES = 500;
export const DUPLICATE_WINDOW_HOURS = 24;

const EARTH_RADIUS_METRES = 6_371_000;
const MS_PER_HOUR = 60 * 60 * 1000;

export interface ReportPlace {
  location: Location;
  capturedAt: Date;
}

export interface KnownReport extends ReportPlace {
  id: string;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Haversine formula: straight-line distance in metres between two GPS points
 * on the Earth.
 */
export function distanceInMetres(a: Location, b: Location): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) *
      Math.cos(toRadians(b.latitude)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METRES * Math.asin(Math.sqrt(h));
}

/** checkDuplicate(report) from the Submit Hazard Report sequence diagram. */
@Injectable()
export class DuplicateChecker {
  /**
   * The dates between which an earlier report can still be a duplicate.
   * The caller uses it to fetch candidates, so the time rule lives only here.
   */
  searchWindow(capturedAt: Date): { from: Date; to: Date } {
    const windowMs = DUPLICATE_WINDOW_HOURS * MS_PER_HOUR;
    return {
      from: new Date(capturedAt.getTime() - windowMs),
      to: new Date(capturedAt.getTime() + windowMs),
    };
  }

  /**
   * Ids of the known reports that are close in place and time to the new one.
   * The caller passes reports of the same hazard type.
   */
  findDuplicateIds(
    newReport: ReportPlace,
    knownReports: KnownReport[],
  ): string[] {
    const windowMs = DUPLICATE_WINDOW_HOURS * MS_PER_HOUR;
    return knownReports
      .filter((known) => {
        const closeInTime =
          Math.abs(
            newReport.capturedAt.getTime() - known.capturedAt.getTime(),
          ) < windowMs;
        const closeInSpace =
          distanceInMetres(newReport.location, known.location) <=
          DUPLICATE_RADIUS_METRES;
        return closeInTime && closeInSpace;
      })
      .map((known) => known.id);
  }
}
