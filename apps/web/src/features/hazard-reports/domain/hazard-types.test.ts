import { describe, expect, it } from 'vitest';
import type { HazardType } from '@rescue-lk/shared';
import {
  HAZARD_TYPE_OPTIONS,
  findHazardType,
  hazardTitle,
} from './hazard-types';

describe('HAZARD_TYPE_OPTIONS', () => {
  it('lists the five hazard types of the design, in order', () => {
    expect(HAZARD_TYPE_OPTIONS.map((option) => option.label)).toEqual([
      'Flood',
      'Landslide',
      'Road Blockage',
      'Fire',
      'Other',
    ]);
  });
});

describe('findHazardType', () => {
  it('finds an option by its value', () => {
    expect(findHazardType('fire').icon).toBe('flame');
  });

  it('throws for a value that is not a hazard type', () => {
    expect(() => findHazardType('tsunami' as HazardType)).toThrow(
      'Unknown hazard type',
    );
  });
});

describe('hazardTitle', () => {
  it('uses the label of a normal type', () => {
    expect(hazardTitle('road_blockage')).toBe('Road Blockage');
  });

  it('shows what the reporter typed for the other type', () => {
    expect(hazardTitle('other', 'Fallen power line')).toBe('Fallen power line');
  });

  it('falls back to "Other" when nothing was typed', () => {
    expect(hazardTitle('other')).toBe('Other');
  });

  it('ignores the typed text for a normal type', () => {
    expect(hazardTitle('flood', 'something')).toBe('Flood');
  });
});
