import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { vi } from 'vitest';
import type {
  DistrictDto,
  OwnerDto,
  ReliefDistributionDto,
  RescueTeamDto,
  ResponseTargetDto,
  ShelterDto,
} from '@rescue-lk/shared';
import { ResponseApiProvider } from '../api/api-context';
import type { DistrictsApi } from '../api/districts-api';
import type { ResponseApi } from '../api/response-api';

// Helpers shared by the UC3 tests: fake APIs, sample data and a render with
// the providers in place.

export const DISTRICTS: DistrictDto[] = [
  {
    id: 'd-kan',
    name: 'Kandy',
    province: 'Central',
    latitude: 7.2906,
    longitude: 80.6337,
  },
  {
    id: 'd-col',
    name: 'Colombo',
    province: 'Western',
    latitude: 6.9271,
    longitude: 79.8612,
  },
];

export const ARMY_OWNER: OwnerDto = {
  organisationId: 'org-army',
  name: 'Sri Lanka Army',
  kind: 'armed_forces',
};

export const NGO_OWNER: OwnerDto = {
  organisationId: 'org-redcross',
  name: 'Sri Lanka Red Cross',
  kind: 'ngo',
};

export function sampleReport(
  overrides: Partial<ResponseTargetDto> = {},
): ResponseTargetDto {
  return {
    id: '65f1a2b3c4d5e6f7a8b9c0d1',
    hazardType: 'flood',
    description: 'Water is rising on Main Street',
    placeName: 'Riverside Road',
    district: 'd-kan',
    location: { latitude: 7.2906, longitude: 80.6337 },
    capturedAt: '2026-10-09T08:00:00.000Z',
    dispatchedTeams: 0,
    needsResponse: true,
    ...overrides,
  };
}

export function sampleTeam(
  overrides: Partial<RescueTeamDto> = {},
): RescueTeamDto {
  return {
    id: '6ac71f73f776c0e7b5e78e36',
    name: 'Army Rescue Unit 3',
    owner: ARMY_OWNER,
    status: 'available',
    district: 'd-kan',
    location: { latitude: 7.2906, longitude: 80.6337 },
    ...overrides,
  };
}

export function sampleShelter(overrides: Partial<ShelterDto> = {}): ShelterDto {
  return {
    id: '70b82f84f887d1f8c6f89f47',
    name: 'Kandy Central College Hall',
    owner: NGO_OWNER,
    district: 'd-kan',
    capacity: 400,
    currentOccupancy: 100,
    status: 'available',
    placesAvailable: 300,
    ...overrides,
  };
}

export function sampleRelief(
  overrides: Partial<ReliefDistributionDto> = {},
): ReliefDistributionDto {
  return {
    id: 'rd-1',
    item: 'water',
    quantity: 500,
    district: 'd-kan',
    owner: NGO_OWNER,
    distributedAt: '2026-10-09T09:30:00.000Z',
    ...overrides,
  };
}

/** A fake API: every call is a mock with a simple default answer. */
export function fakeResponseApi(
  overrides: Partial<ResponseApi> = {},
): ResponseApi {
  return {
    listReports: vi.fn(async () => [sampleReport()]),
    listTeams: vi.fn(async () => ({
      teams: [sampleTeam()],
      availableCount: 1,
    })),
    dispatch: vi.fn(async () => ({
      dispatch: {
        id: 'dp-1',
        reportId: sampleReport().id,
        teamId: sampleTeam().id,
        teamName: sampleTeam().name,
        owner: ARMY_OWNER,
        district: 'd-kan',
        dispatchedBy: 'officer-sp',
        dispatchedAt: '2026-10-09T10:00:00.000Z',
      },
      team: sampleTeam({ status: 'dispatched' }),
    })),
    listDispatchesForReport: vi.fn(async () => []),
    changeTeamStatus: vi.fn(async () => sampleTeam({ status: 'returning' })),
    listShelters: vi.fn(async () => [sampleShelter()]),
    changeOccupancy: vi.fn(async () =>
      sampleShelter({ currentOccupancy: 125, placesAvailable: 275 }),
    ),
    listRelief: vi.fn(async () => [sampleRelief()]),
    logRelief: vi.fn(async () => sampleRelief()),
    ...overrides,
  };
}

export function fakeDistrictsApi(
  districts: DistrictDto[] = DISTRICTS,
): DistrictsApi {
  return { list: vi.fn(async () => districts) };
}

/** Renders a component with the fake APIs behind it. */
export function renderWithApis(
  ui: ReactElement,
  apis: { response?: ResponseApi; districts?: DistrictsApi } = {},
) {
  const response = apis.response ?? fakeResponseApi();
  const districts = apis.districts ?? fakeDistrictsApi();
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ResponseApiProvider response={response} districts={districts}>
        {children}
      </ResponseApiProvider>
    );
  }
  return Object.assign(render(ui, { wrapper: Wrapper }), {
    response,
    districts,
  });
}
