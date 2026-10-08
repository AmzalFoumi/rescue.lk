import { describe, it, expect } from 'vitest';
import type { TeamStatus } from '@rescue-lk/shared';
import {
  HAZARD_PRESENTATION,
  MANUAL_TEAM_STATUS_CHANGES,
  ORGANISATION_KIND_LABELS,
  RELIEF_ITEM_LABELS,
  SHELTER_STATUS_PRESENTATION,
  TEAM_STATUS_PRESENTATION,
} from './presentation';

describe('presentation tables', () => {
  it('gives every hazard type a label, a tone and an icon', () => {
    for (const presentation of Object.values(HAZARD_PRESENTATION)) {
      expect(presentation.label).not.toBe('');
      expect(presentation.icon).not.toBe('');
    }
  });

  it('names the four kinds of owner the case study asks for', () => {
    expect(Object.keys(ORGANISATION_KIND_LABELS)).toEqual([
      'government',
      'armed_forces',
      'ngo',
      'private_donor',
    ]);
  });

  it('names the relief items the case study asks for', () => {
    expect(RELIEF_ITEM_LABELS.food).toBe('Food');
    expect(RELIEF_ITEM_LABELS.water).toBe('Water');
    expect(RELIEF_ITEM_LABELS.medicine).toBe('Medicine');
  });

  it('pairs each shelter status with a word, not only a colour', () => {
    expect(SHELTER_STATUS_PRESENTATION.full.label).toBe('Full');
    expect(SHELTER_STATUS_PRESENTATION.nearly_full.label).toBe('Nearly full');
    expect(SHELTER_STATUS_PRESENTATION.available.label).toBe('Available');
  });

  it('covers every team status', () => {
    expect(Object.keys(TEAM_STATUS_PRESENTATION)).toHaveLength(4);
  });
});

describe('MANUAL_TEAM_STATUS_CHANGES', () => {
  it('never offers Dispatched, which only Dispatch Rescue Team may set', () => {
    for (const next of Object.values(MANUAL_TEAM_STATUS_CHANGES)) {
      expect(next).not.toContain('dispatched');
    }
  });

  it('lets a team out on a job report that it is returning', () => {
    expect(MANUAL_TEAM_STATUS_CHANGES.dispatched).toContain('returning');
  });

  it('lets a returning team become available again', () => {
    expect(MANUAL_TEAM_STATUS_CHANGES.returning).toContain('available');
  });

  it('covers every status it could be asked about', () => {
    const statuses: TeamStatus[] = [
      'available',
      'dispatched',
      'returning',
      'unavailable',
    ];
    for (const status of statuses) {
      expect(MANUAL_TEAM_STATUS_CHANGES[status]).toBeDefined();
    }
  });
});
