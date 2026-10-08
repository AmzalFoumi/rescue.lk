import { describe, it, expect } from 'vitest';
import {
  DISTRICTS,
  NGO_OWNER,
  sampleReport,
  sampleShelter,
  sampleTeam,
} from '../testing/test-support';
import {
  EMPTY_INCIDENT_FILTERS,
  EMPTY_SHELTER_FILTERS,
  EMPTY_TEAM_FILTERS,
  filterIncidents,
  filterShelters,
  filterTeams,
} from './filters';

describe('filterIncidents', () => {
  const reports = [
    sampleReport(),
    sampleReport({
      id: 'r2',
      hazardType: 'fire',
      placeName: 'Pettah Market',
      district: 'd-col',
      needsResponse: false,
      dispatchedTeams: 2,
    }),
  ];

  it('keeps everything when no filter is set', () => {
    expect(
      filterIncidents(reports, EMPTY_INCIDENT_FILTERS, DISTRICTS),
    ).toHaveLength(2);
  });

  it('searches the place, the description and the district name', () => {
    const byPlace = filterIncidents(
      reports,
      { ...EMPTY_INCIDENT_FILTERS, search: 'pettah' },
      DISTRICTS,
    );
    expect(byPlace.map((r) => r.id)).toEqual(['r2']);

    const byDistrict = filterIncidents(
      reports,
      { ...EMPTY_INCIDENT_FILTERS, search: 'kandy' },
      DISTRICTS,
    );
    expect(byDistrict).toHaveLength(1);
  });

  it('filters by hazard type', () => {
    expect(
      filterIncidents(
        reports,
        { ...EMPTY_INCIDENT_FILTERS, hazardType: 'fire' },
        DISTRICTS,
      ).map((r) => r.id),
    ).toEqual(['r2']);
  });

  it('filters by district', () => {
    expect(
      filterIncidents(
        reports,
        { ...EMPTY_INCIDENT_FILTERS, district: 'd-col' },
        DISTRICTS,
      ),
    ).toHaveLength(1);
  });

  it('separates the incidents waiting for a team from those covered', () => {
    expect(
      filterIncidents(
        reports,
        { ...EMPTY_INCIDENT_FILTERS, responseStatus: 'needs_response' },
        DISTRICTS,
      ).every((r) => r.needsResponse),
    ).toBe(true);

    expect(
      filterIncidents(
        reports,
        { ...EMPTY_INCIDENT_FILTERS, responseStatus: 'has_team' },
        DISTRICTS,
      ).map((r) => r.id),
    ).toEqual(['r2']);
  });
});

describe('filterTeams', () => {
  const teams = [
    sampleTeam(),
    sampleTeam({
      id: 't2',
      name: 'Red Cross Mobile Team 1',
      owner: NGO_OWNER,
      status: 'dispatched',
      district: 'd-col',
    }),
  ];
  const offFilters = { ...EMPTY_TEAM_FILTERS, nearbyOnly: false };

  it('keeps every organisation when no filter is set', () => {
    expect(filterTeams(teams, offFilters)).toHaveLength(2);
  });

  it('searches the team name and the organisation', () => {
    expect(
      filterTeams(teams, { ...offFilters, search: 'red cross' }).map(
        (t) => t.id,
      ),
    ).toEqual(['t2']);
  });

  it('filters by the kind of owner', () => {
    expect(
      filterTeams(teams, { ...offFilters, owner: 'armed_forces' }).map(
        (t) => t.id,
      ),
    ).toEqual([sampleTeam().id]);
  });

  it('filters by status', () => {
    expect(
      filterTeams(teams, { ...offFilters, status: 'available' }),
    ).toHaveLength(1);
  });

  it('keeps only the incident district when "nearby" is on', () => {
    expect(
      filterTeams(teams, EMPTY_TEAM_FILTERS, 'd-col').map((t) => t.id),
    ).toEqual(['t2']);
  });

  it('does nothing with "nearby" on but no incident chosen', () => {
    expect(filterTeams(teams, EMPTY_TEAM_FILTERS)).toHaveLength(2);
  });
});

describe('filterShelters', () => {
  const shelters = [
    sampleShelter(),
    sampleShelter({
      id: 's2',
      name: 'Colombo Municipal Hall',
      district: 'd-col',
      status: 'full',
    }),
  ];

  it('keeps everything when no filter is set', () => {
    expect(
      filterShelters(shelters, EMPTY_SHELTER_FILTERS, DISTRICTS),
    ).toHaveLength(2);
  });

  it('searches the name and the district', () => {
    expect(
      filterShelters(
        shelters,
        { ...EMPTY_SHELTER_FILTERS, search: 'municipal' },
        DISTRICTS,
      ).map((s) => s.id),
    ).toEqual(['s2']);

    expect(
      filterShelters(
        shelters,
        { ...EMPTY_SHELTER_FILTERS, search: 'kandy' },
        DISTRICTS,
      ),
    ).toHaveLength(1);
  });

  it('filters by status and by district', () => {
    expect(
      filterShelters(
        shelters,
        { ...EMPTY_SHELTER_FILTERS, status: 'full' },
        DISTRICTS,
      ).map((s) => s.id),
    ).toEqual(['s2']);

    expect(
      filterShelters(
        shelters,
        { ...EMPTY_SHELTER_FILTERS, district: 'd-kan' },
        DISTRICTS,
      ),
    ).toHaveLength(1);
  });
});
