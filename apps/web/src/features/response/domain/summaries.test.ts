import { describe, it, expect } from 'vitest';
import {
  DISTRICTS,
  NGO_OWNER,
  sampleRelief,
  sampleReport,
  sampleShelter,
  sampleTeam,
} from '../testing/test-support';
import {
  organisationCount,
  reliefByDistrict,
  responseKpis,
  shelterTotals,
  teamStatusCounts,
} from './summaries';

describe('shelterTotals', () => {
  it('adds up the rows it was given', () => {
    const totals = shelterTotals([
      sampleShelter({
        capacity: 400,
        currentOccupancy: 320,
        placesAvailable: 80,
      }),
      sampleShelter({
        id: 's2',
        capacity: 200,
        currentOccupancy: 200,
        placesAvailable: 0,
        status: 'full',
      }),
    ]);

    expect(totals).toMatchObject({
      shelters: 2,
      capacity: 600,
      occupancy: 520,
      placesAvailable: 80,
      percentage: '87%',
      full: 1,
    });
  });

  it('counts nearly full shelters separately', () => {
    const totals = shelterTotals([sampleShelter({ status: 'nearly_full' })]);
    expect(totals.nearlyFull).toBe(1);
    expect(totals.full).toBe(0);
  });

  it('is all zeros with no shelters', () => {
    expect(shelterTotals([])).toMatchObject({
      shelters: 0,
      capacity: 0,
      occupancy: 0,
      percentage: '0%',
    });
  });
});

describe('teamStatusCounts', () => {
  it('counts every status, including the ones with no teams', () => {
    const counts = teamStatusCounts([
      sampleTeam(),
      sampleTeam({ id: 't2', status: 'dispatched' }),
      sampleTeam({ id: 't3', status: 'dispatched' }),
    ]);

    expect(counts).toHaveLength(4);
    expect(counts.find((c) => c.status === 'dispatched')?.count).toBe(2);
    expect(counts.find((c) => c.status === 'available')?.count).toBe(1);
    expect(counts.find((c) => c.status === 'returning')?.count).toBe(0);
  });
});

describe('organisationCount', () => {
  it('counts each organisation once however many teams it owns', () => {
    expect(
      organisationCount([
        sampleTeam(),
        sampleTeam({ id: 't2' }),
        sampleTeam({ id: 't3', owner: NGO_OWNER }),
      ]),
    ).toBe(2);
  });

  it('is zero with no teams', () => {
    expect(organisationCount([])).toBe(0);
  });
});

describe('reliefByDistrict', () => {
  it('adds up the quantity per district, largest first', () => {
    const rows = reliefByDistrict(
      [
        sampleRelief({ district: 'd-kan', quantity: 100 }),
        sampleRelief({ id: 'r2', district: 'd-col', quantity: 300 }),
        sampleRelief({ id: 'r3', district: 'd-kan', quantity: 50 }),
      ],
      DISTRICTS,
    );

    expect(rows.map((row) => [row.name, row.quantity])).toEqual([
      ['Colombo', 300],
      ['Kandy', 150],
    ]);
  });

  it('gives the largest district a full bar and the rest a share of it', () => {
    const rows = reliefByDistrict(
      [
        sampleRelief({ district: 'd-kan', quantity: 100 }),
        sampleRelief({ id: 'r2', district: 'd-col', quantity: 200 }),
      ],
      DISTRICTS,
    );

    expect(rows[0].share).toBe(1);
    expect(rows[1].share).toBe(0.5);
  });

  it('returns nothing when nothing was distributed', () => {
    expect(reliefByDistrict([], DISTRICTS)).toEqual([]);
  });
});

describe('responseKpis', () => {
  it('counts the incidents that still need a team', () => {
    const kpis = responseKpis(
      [
        sampleReport(),
        sampleReport({ id: 'r2', needsResponse: false, dispatchedTeams: 1 }),
      ],
      [sampleTeam()],
      [sampleShelter()],
    );

    expect(kpis.find((k) => k.key === 'incidents')?.value).toBe('2');
    expect(kpis.find((k) => k.key === 'awaiting')?.value).toBe('1');
    expect(kpis.find((k) => k.key === 'awaiting')?.sub).toBe('Need dispatch');
  });

  it('says every incident is covered when none is waiting', () => {
    const kpis = responseKpis(
      [sampleReport({ needsResponse: false, dispatchedTeams: 1 })],
      [],
      [],
    );

    const awaiting = kpis.find((k) => k.key === 'awaiting');
    expect(awaiting?.value).toBe('0');
    expect(awaiting?.sub).toBe('All incidents covered');
    expect(awaiting?.tone).toBe('success');
  });

  it('shows the dispatched teams, the free ones and how many organisations', () => {
    const kpis = responseKpis(
      [],
      [
        sampleTeam({ status: 'dispatched' }),
        sampleTeam({ id: 't2', owner: NGO_OWNER }),
      ],
      [],
    );

    const teams = kpis.find((k) => k.key === 'teams');
    expect(teams?.value).toBe('1 of 2');
    expect(teams?.sub).toBe('1 available · 2 organisations');
  });

  it('turns the shelter card red once a shelter is full', () => {
    const kpis = responseKpis([], [], [sampleShelter({ status: 'full' })]);
    expect(kpis.find((k) => k.key === 'shelters')?.tone).toBe('danger');
  });

  it('keeps the shelter card neutral while there is room', () => {
    const kpis = responseKpis([], [], [sampleShelter()]);
    const shelters = kpis.find((k) => k.key === 'shelters');
    expect(shelters?.tone).toBe('neutral');
    expect(shelters?.value).toBe('100 / 400');
  });
});
