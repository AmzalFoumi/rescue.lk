import { describe, it, expect } from 'vitest';
import {
  isWithinRange,
  matchesDistrict,
  matchesHazard,
} from './filter-predicates.js';
import type { AnalyticsFilters } from '../domain/analytics-filters.js';

describe('Filter Predicates', () => {
  describe('matchesDistrict', () => {
    it.each([
      {
        district: 'Colombo',
        filter: undefined,
        expected: true,
        desc: 'matches when filter is undefined',
      },
      {
        district: 'colombo',
        filter: 'Colombo',
        expected: true,
        desc: 'matches exact case-insensitive',
      },
      {
        district: 'Colombo',
        filter: 'colombo',
        expected: true,
        desc: 'matches exact case-insensitive reversed',
      },
      {
        district: 'Kandy',
        filter: 'Colombo',
        expected: false,
        desc: 'fails when different',
      },
    ])(
      'should return $expected when $desc',
      ({ district, filter, expected }) => {
        expect(
          matchesDistrict(district, { district: filter } as AnalyticsFilters),
        ).toBe(expected);
      },
    );
  });

  describe('matchesHazard', () => {
    it.each([
      {
        hazard: 'Flood',
        filter: undefined,
        expected: true,
        desc: 'matches when filter is undefined',
      },
      {
        hazard: 'flood',
        filter: 'Flood',
        expected: true,
        desc: 'matches exact case-insensitive',
      },
      {
        hazard: 'Flood',
        filter: 'flood',
        expected: true,
        desc: 'matches exact case-insensitive reversed',
      },
      {
        hazard: 'Fire',
        filter: 'Flood',
        expected: false,
        desc: 'fails when different',
      },
    ])('should return $expected when $desc', ({ hazard, filter, expected }) => {
      expect(
        matchesHazard(hazard, { hazardType: filter } as AnalyticsFilters),
      ).toBe(expected);
    });
  });

  describe('isWithinRange', () => {
    it.each([
      {
        date: '2026-10-07T14:00:00Z',
        from: '2026-10-06T00:00:00Z',
        to: '2026-10-07T00:00:00Z',
        expected: true,
        desc: 'includes end of to date (UTC)',
      },
      {
        date: '2026-10-07T23:59:59Z',
        from: '2026-10-07T00:00:00Z',
        to: '2026-10-07T00:00:00Z',
        expected: true,
        desc: 'from = to and date is exactly at the end of the day',
      },
      {
        date: '2026-10-05T14:00:00Z',
        from: '2026-10-06T00:00:00Z',
        to: '2026-10-07T00:00:00Z',
        expected: false,
        desc: 'fails if before from',
      },
      {
        date: '2026-10-08T01:00:00Z',
        from: '2026-10-06T00:00:00Z',
        to: '2026-10-07T00:00:00Z',
        expected: false,
        desc: 'fails if after end of to',
      },
      {
        date: '2026-10-08T05:00:00Z',
        from: '2026-10-06T00:00:00Z',
        to: '2026-10-07T00:00:00Z',
        expected: false,
        desc: 'fails outside range, handles UTC properly',
      },
    ])('should return $expected when $desc', ({ date, from, to, expected }) => {
      expect(isWithinRange(new Date(date), new Date(from), new Date(to))).toBe(
        expected,
      );
    });
  });
});
