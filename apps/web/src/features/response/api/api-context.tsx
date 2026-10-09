'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { createDistrictsApi, type DistrictsApi } from './districts-api';
import { createResponseApi, type ResponseApi } from './response-api';

interface Apis {
  response: ResponseApi;
  districts: DistrictsApi;
}

// The default is the real API, so the app needs no setup. Tests replace it with fakes.
const ApiContext = createContext<Apis>({
  response: createResponseApi(),
  districts: createDistrictsApi(),
});

export function ResponseApiProvider({
  children,
  ...apis
}: Apis & { children: ReactNode }) {
  return <ApiContext.Provider value={apis}>{children}</ApiContext.Provider>;
}

export function useResponseApi(): ResponseApi {
  return useContext(ApiContext).response;
}

export function useDistrictsApi(): DistrictsApi {
  return useContext(ApiContext).districts;
}
