'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { createDistrictsApi, type DistrictsApi } from './districts-api';
import {
  createHazardReportsApi,
  type HazardReportsApi,
} from './hazard-reports-api';

interface Apis {
  hazardReports: HazardReportsApi;
  districts: DistrictsApi;
}

// The default is the real API, so the app needs no setup. Tests replace it with fakes.
const ApiContext = createContext<Apis>({
  hazardReports: createHazardReportsApi(),
  districts: createDistrictsApi(),
});

export function ApiProvider({
  children,
  ...apis
}: Apis & { children: ReactNode }) {
  return <ApiContext.Provider value={apis}>{children}</ApiContext.Provider>;
}

export function useHazardReportsApi(): HazardReportsApi {
  return useContext(ApiContext).hazardReports;
}

export function useDistrictsApi(): DistrictsApi {
  return useContext(ApiContext).districts;
}
