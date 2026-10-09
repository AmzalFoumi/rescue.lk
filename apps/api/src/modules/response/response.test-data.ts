import { vi } from 'vitest';
import type { DispatchRecord } from './dispatch-record.js';
import type { DispatchesRepository } from './dispatches.repository.interface.js';
import { OrganisationKind } from './organisation.js';
import type { Owner } from './organisation.js';
import { ReliefItem } from './relief-distribution.js';
import type { ReliefDistributionRecord } from './relief-distribution.js';
import type { ReliefDistributionsRepository } from './relief-distributions.repository.interface.js';
import type { RescueTeamRecord } from './rescue-team.js';
import type { RescueTeamsRepository } from './rescue-teams.repository.interface.js';
import type { ShelterRecord } from './shelter.js';
import type { SheltersRepository } from './shelters.repository.interface.js';
import { TeamStatus } from './team-status.js';
import type { VerifiedReportSummary } from './verified-report.js';
import type { VerifiedReportsPort } from './verified-reports.port.js';

// Shared by the service tests, so the fake data is written once.

export const TEAM_ID = '6ac71f73f776c0e7b5e78e36';
export const REPORT_ID = '65f1a2b3c4d5e6f7a8b9c0d1';
export const SHELTER_ID = '70b82f84f887d1f8c6f89f47';
export const DISTRICT_ID = '65f1a2b3c4d5e6f7a8b9c0d2';
export const MISSING_ID = '000000000000000000000000';
export const OFFICER_ID = 'officer-001';

export const armyOwner: Owner = {
  organisationId: '65f1a2b3c4d5e6f7a8b9c0d3',
  name: 'Sri Lanka Army',
  kind: OrganisationKind.ArmedForces,
};

export const ngoOwner: Owner = {
  organisationId: '65f1a2b3c4d5e6f7a8b9c0d4',
  name: 'Sri Lanka Red Cross',
  kind: OrganisationKind.Ngo,
};

export function team(
  overrides: Partial<RescueTeamRecord> = {},
): RescueTeamRecord {
  return {
    id: TEAM_ID,
    name: 'Army Rescue Unit 3',
    owner: armyOwner,
    status: TeamStatus.Available,
    district: DISTRICT_ID,
    location: { latitude: 7.2906, longitude: 80.6337 },
    ...overrides,
  };
}

export function verifiedReport(
  overrides: Partial<VerifiedReportSummary> = {},
): VerifiedReportSummary {
  return {
    id: REPORT_ID,
    hazardType: 'flood',
    description: 'Water is rising on Main Street',
    district: DISTRICT_ID,
    location: { latitude: 7.2906, longitude: 80.6337 },
    placeName: 'Riverside Road',
    capturedAt: new Date('2026-10-09T08:00:00Z'),
    ...overrides,
  };
}

export function dispatchRecord(
  overrides: Partial<DispatchRecord> = {},
): DispatchRecord {
  return {
    id: 'd1',
    reportId: REPORT_ID,
    teamId: TEAM_ID,
    teamName: 'Army Rescue Unit 3',
    owner: armyOwner,
    district: DISTRICT_ID,
    dispatchedBy: OFFICER_ID,
    dispatchedAt: new Date('2026-10-09T09:00:00Z'),
    ...overrides,
  };
}

export function shelter(overrides: Partial<ShelterRecord> = {}): ShelterRecord {
  return {
    id: SHELTER_ID,
    name: 'Kandy Central College Hall',
    owner: ngoOwner,
    district: DISTRICT_ID,
    capacity: 400,
    currentOccupancy: 100,
    ...overrides,
  };
}

export function reliefRecord(
  overrides: Partial<ReliefDistributionRecord> = {},
): ReliefDistributionRecord {
  return {
    id: 'r1',
    item: ReliefItem.Water,
    quantity: 500,
    district: DISTRICT_ID,
    owner: ngoOwner,
    distributedAt: new Date('2026-10-09T09:30:00Z'),
    ...overrides,
  };
}

/** Repositories whose methods are mocks, with simple default answers. */

export function fakeTeamsRepository(): RescueTeamsRepository {
  return {
    findAll: vi.fn().mockResolvedValue([team()]),
    findById: vi.fn().mockResolvedValue(team()),
    dispatch: vi.fn(async (_id, assignment) =>
      team({ status: TeamStatus.Dispatched, activeDispatch: assignment }),
    ),
    changeStatus: vi.fn(async (_id, status) => team({ status })),
  };
}

export function fakeDispatchesRepository(): DispatchesRepository {
  return {
    create: vi.fn(async (dispatch) => dispatchRecord({ ...dispatch })),
    findByReport: vi.fn().mockResolvedValue([dispatchRecord()]),
    countByReport: vi.fn().mockResolvedValue({}),
  };
}

export function fakeSheltersRepository(): SheltersRepository {
  return {
    findAll: vi.fn().mockResolvedValue([shelter()]),
    findById: vi.fn().mockResolvedValue(shelter()),
    changeOccupancy: vi.fn(async (_id, people) =>
      shelter({ currentOccupancy: 100 + people }),
    ),
  };
}

export function fakeReliefRepository(): ReliefDistributionsRepository {
  return {
    create: vi.fn(async (distribution) => reliefRecord({ ...distribution })),
    findAll: vi.fn().mockResolvedValue([reliefRecord()]),
  };
}

export function fakeVerifiedReports(): VerifiedReportsPort {
  return {
    findVerified: vi.fn().mockResolvedValue([verifiedReport()]),
    findVerifiedById: vi.fn().mockResolvedValue(verifiedReport()),
  };
}
