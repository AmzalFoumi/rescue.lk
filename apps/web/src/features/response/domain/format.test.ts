import { describe, it, expect } from 'vitest';
import { DISTRICTS } from '../testing/test-support';
import {
  districtName,
  formatDate,
  formatDateTime,
  formatNumber,
  percentage,
  placeLabel,
  teamCountLabel,
} from './format';

describe('formatNumber', () => {
  it('groups thousands', () => {
    expect(formatNumber(12_500)).toBe('12,500');
  });

  it('leaves small numbers alone', () => {
    expect(formatNumber(7)).toBe('7');
  });
});

describe('percentage', () => {
  it('rounds to a whole percent', () => {
    expect(percentage(320, 400)).toBe('80%');
    expect(percentage(1, 3)).toBe('33%');
  });

  it('is 0% for an empty whole instead of NaN', () => {
    expect(percentage(0, 0)).toBe('0%');
    expect(percentage(5, -1)).toBe('0%');
  });
});

describe('districtName', () => {
  it('finds the name of a known district', () => {
    expect(districtName('d-kan', DISTRICTS)).toBe('Kandy');
  });

  it('falls back to the id when the districts are not loaded', () => {
    expect(districtName('d-kan', [])).toBe('d-kan');
  });
});

describe('placeLabel', () => {
  it('joins the place and the district', () => {
    expect(placeLabel('Riverside Road', 'd-kan', DISTRICTS)).toBe(
      'Riverside Road, Kandy',
    );
  });

  it('shows the district alone when no place was given', () => {
    expect(placeLabel(undefined, 'd-col', DISTRICTS)).toBe('Colombo');
  });
});

describe('formatDateTime and formatDate', () => {
  it('shows a short date and time', () => {
    expect(formatDateTime('2026-10-09T08:00:00.000Z')).toMatch(/Oct/);
  });

  it('shows a date with the year', () => {
    expect(formatDate('2026-10-09T08:00:00.000Z')).toMatch(/2026/);
  });

  it('gives back text that is not a date unchanged', () => {
    expect(formatDateTime('not a date')).toBe('not a date');
    expect(formatDate('not a date')).toBe('not a date');
  });
});

describe('teamCountLabel', () => {
  it('names the number of teams', () => {
    expect(teamCountLabel(0)).toBe('No team yet');
    expect(teamCountLabel(1)).toBe('1 team');
    expect(teamCountLabel(3)).toBe('3 teams');
  });
});
