import { describe, it, expect } from 'vitest';
import {
  DUPLICATE_RADIUS_METRES,
  DuplicateChecker,
  distanceInMetres,
  type KnownReport,
} from './duplicate-checker.js';

const now = new Date('2026-10-08T10:00:00Z');
const colombo = { latitude: 6.9271, longitude: 79.8612 };

// ~111 m per 0.001 degree of latitude, so these are easy to reason about.
const known = (
  id: string,
  latOffset: number,
  hoursAgo: number,
): KnownReport => ({
  id,
  location: {
    latitude: colombo.latitude + latOffset,
    longitude: colombo.longitude,
  },
  capturedAt: new Date(now.getTime() - hoursAgo * 3600 * 1000),
});

describe('distanceInMetres', () => {
  it('is zero for the same point', () => {
    expect(distanceInMetres(colombo, colombo)).toBe(0);
  });

  it('is about 111 km for one degree of latitude', () => {
    const d = distanceInMetres(colombo, {
      ...colombo,
      latitude: colombo.latitude + 1,
    });
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });
});

describe('DuplicateChecker', () => {
  const checker = new DuplicateChecker();
  const report = { location: colombo, capturedAt: now };

  it('flags a nearby, recent report', () => {
    expect(checker.findDuplicateIds(report, [known('a', 0.001, 1)])).toEqual([
      'a',
    ]);
  });

  it('ignores a report that is too far away', () => {
    expect(checker.findDuplicateIds(report, [known('a', 0.01, 1)])).toEqual([]);
  });

  it('ignores a report older than the time window', () => {
    expect(checker.findDuplicateIds(report, [known('a', 0.001, 25)])).toEqual(
      [],
    );
  });

  it('flags a report just inside the radius', () => {
    // 0.0044 degrees is about 489 m
    expect(
      distanceInMetres(report.location, known('a', 0.0044, 1).location),
    ).toBeLessThan(DUPLICATE_RADIUS_METRES);
    expect(checker.findDuplicateIds(report, [known('a', 0.0044, 1)])).toEqual([
      'a',
    ]);
  });

  it('ignores a report just outside the radius', () => {
    // 0.0046 degrees is about 511 m
    expect(checker.findDuplicateIds(report, [known('a', 0.0046, 1)])).toEqual(
      [],
    );
  });

  it('returns nothing when there are no known reports', () => {
    expect(checker.findDuplicateIds(report, [])).toEqual([]);
  });

  it('returns only the matching ids from a mixed list', () => {
    const list = [
      known('near', 0.001, 2),
      known('far', 0.05, 2),
      known('old', 0.001, 30),
    ];
    expect(checker.findDuplicateIds(report, list)).toEqual(['near']);
  });
});

describe('DuplicateChecker.searchWindow', () => {
  const checker = new DuplicateChecker();
  const hour = 60 * 60 * 1000;

  it('spans the time window on both sides of the capture time', () => {
    const { from, to } = checker.searchWindow(now);
    expect(from.getTime()).toBe(now.getTime() - 24 * hour);
    expect(to.getTime()).toBe(now.getTime() + 24 * hour);
  });
});
