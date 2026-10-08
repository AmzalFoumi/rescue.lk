import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { vi } from 'vitest';
import type { DistrictDto, HazardReportDto } from '@rescue-lk/shared';
import { ApiProvider } from '../api/api-context';
import type { DistrictsApi } from '../api/districts-api';
import type { HazardReportsApi } from '../api/hazard-reports-api';
import { ReportingProvider } from '../state/reporting-context';

// Helpers shared by the UC2 tests: fake APIs, sample data and a render with providers.

export const DISTRICTS: DistrictDto[] = [
  {
    id: 'd-col',
    name: 'Colombo',
    province: 'Western',
    latitude: 6.9271,
    longitude: 79.8612,
  },
  {
    id: 'd-rat',
    name: 'Ratnapura',
    province: 'Sabaragamuwa',
    latitude: 6.6828,
    longitude: 80.3992,
  },
];

export function sampleReport(
  overrides: Partial<HazardReportDto> = {},
): HazardReportDto {
  return {
    id: '6ac71f73f776c0e7b5e78e36',
    hazardType: 'flood',
    description: 'Water is rising on Main Street',
    location: { latitude: 6.6828, longitude: 80.3992 },
    district: 'd-rat',
    capturedAt: '2026-10-07T10:40:00.000Z',
    submittedAt: '2026-10-07T10:40:02.000Z',
    status: 'pending_verification',
    possibleDuplicateOf: [],
    reporterId: 'citizen-nimal',
    reporterRole: 'citizen',
    ...overrides,
  };
}

/** A fake API: every call is a mock with a simple default answer. */
export function fakeHazardReportsApi(
  overrides: Partial<HazardReportsApi> = {},
): HazardReportsApi {
  return {
    submit: vi.fn(async () => sampleReport()),
    queueOffline: vi.fn(async () => ({
      status: 'pending_synchronisation' as const,
      pendingCount: 1,
    })),
    sync: vi.fn(async () => ({ synced: 1, stillQueued: 0 })),
    listPending: vi.fn(async () => []),
    listByReporter: vi.fn(async () => []),
    getById: vi.fn(async () => sampleReport()),
    verify: vi.fn(async () => sampleReport({ status: 'verified' })),
    reject: vi.fn(async () => sampleReport({ status: 'rejected' })),
    ...overrides,
  };
}

export function fakeDistrictsApi(
  districts: DistrictDto[] = DISTRICTS,
): DistrictsApi {
  return { list: vi.fn(async () => districts) };
}

/** A wrapper that gives a component or hook the fake APIs and the reporting provider. */
export function reportingWrapper(
  apis: { hazardReports?: HazardReportsApi; districts?: DistrictsApi } = {},
) {
  const hazardReports = apis.hazardReports ?? fakeHazardReportsApi();
  const districts = apis.districts ?? fakeDistrictsApi();
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ApiProvider hazardReports={hazardReports} districts={districts}>
        <ReportingProvider>{children}</ReportingProvider>
      </ApiProvider>
    );
  }
  return { Wrapper, hazardReports, districts };
}

export function renderWithReporting(
  ui: ReactElement,
  apis: { hazardReports?: HazardReportsApi; districts?: DistrictsApi } = {},
) {
  const { Wrapper, hazardReports, districts } = reportingWrapper(apis);
  return Object.assign(render(ui, { wrapper: Wrapper }), {
    hazardReports,
    districts,
  });
}
