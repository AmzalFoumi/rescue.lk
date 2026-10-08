import { describe, expect, it } from 'vitest';
import { formatAge, formatCoordinates, formatDateTime } from './format';

const now = new Date('2026-10-08T10:00:00Z');
const ago = (minutes: number) =>
  new Date(now.getTime() - minutes * 60 * 1000).toISOString();

describe('formatDateTime', () => {
  it('shows day, month and 24-hour time in the given time zone', () => {
    expect(formatDateTime('2026-10-07T10:40:00Z', 'UTC')).toBe('7 Oct, 10:40');
  });
});

describe('formatAge', () => {
  it('says "just now" for less than a minute', () => {
    expect(formatAge(ago(0), now)).toBe('just now');
  });

  it('counts minutes up to an hour', () => {
    expect(formatAge(ago(1), now)).toBe('1 min ago');
    expect(formatAge(ago(59), now)).toBe('59 min ago');
  });

  it('counts hours up to a day', () => {
    expect(formatAge(ago(60), now)).toBe('1 h ago');
    expect(formatAge(ago(23 * 60 + 59), now)).toBe('23 h ago');
  });

  it('counts days after that', () => {
    expect(formatAge(ago(24 * 60), now)).toBe('1 d ago');
    expect(formatAge(ago(3 * 24 * 60), now)).toBe('3 d ago');
  });

  it('says "just now" for a time slightly in the future (clock differences)', () => {
    expect(formatAge(ago(-1), now)).toBe('just now');
  });
});

describe('formatCoordinates', () => {
  it('writes north and east with four decimals', () => {
    expect(formatCoordinates(6.68281, 80.39921)).toBe('6.6828° N, 80.3992° E');
  });

  it('writes south and west for negative values', () => {
    expect(formatCoordinates(-33.8688, -70.6693)).toBe(
      '33.8688° S, 70.6693° W',
    );
  });
});
