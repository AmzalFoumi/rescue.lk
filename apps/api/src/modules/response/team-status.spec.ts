import { describe, it, expect } from 'vitest';
import {
  TeamStatus,
  canChangeTeamStatus,
  endsAssignment,
} from './team-status.js';

describe('canChangeTeamStatus', () => {
  it('lets a dispatched team report that it is returning', () => {
    expect(
      canChangeTeamStatus(TeamStatus.Dispatched, TeamStatus.Returning),
    ).toBe(true);
  });

  it('lets a returning team become available again', () => {
    expect(
      canChangeTeamStatus(TeamStatus.Returning, TeamStatus.Available),
    ).toBe(true);
  });

  it('lets any working team be taken out of service', () => {
    expect(
      canChangeTeamStatus(TeamStatus.Available, TeamStatus.Unavailable),
    ).toBe(true);
    expect(
      canChangeTeamStatus(TeamStatus.Dispatched, TeamStatus.Unavailable),
    ).toBe(true);
  });

  it('never lets a team be dispatched by hand', () => {
    for (const from of Object.values(TeamStatus)) {
      expect(canChangeTeamStatus(from, TeamStatus.Dispatched)).toBe(false);
    }
  });

  it('refuses to send an unavailable team straight out', () => {
    expect(
      canChangeTeamStatus(TeamStatus.Unavailable, TeamStatus.Returning),
    ).toBe(false);
  });
});

describe('endsAssignment', () => {
  it('frees the team for every status except Dispatched', () => {
    expect(endsAssignment(TeamStatus.Available)).toBe(true);
    expect(endsAssignment(TeamStatus.Returning)).toBe(true);
    expect(endsAssignment(TeamStatus.Dispatched)).toBe(false);
  });
});
