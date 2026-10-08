'use client';

import { useCallback } from 'react';
import type {
  DistrictDto,
  ReliefDistributionDto,
  ResponseTargetDto,
  ShelterDto,
  TeamAvailabilityDto,
} from '@rescue-lk/shared';
import { useDistrictsApi, useResponseApi } from '../api/api-context';
import { useAsyncData, type AsyncData } from './use-async-data';

/**
 * One hook per list the Response Operations screen shows. `refreshKey` lets a
 * screen reload after a dispatch or an occupancy change.
 */

export function useResponseTargets(
  refreshKey?: unknown,
): AsyncData<ResponseTargetDto[]> {
  const api = useResponseApi();
  const load = useCallback(() => api.listReports(), [api]);
  return useAsyncData(load, refreshKey);
}

export function useTeams(refreshKey?: unknown): AsyncData<TeamAvailabilityDto> {
  const api = useResponseApi();
  const load = useCallback(() => api.listTeams(), [api]);
  return useAsyncData(load, refreshKey);
}

export function useShelters(refreshKey?: unknown): AsyncData<ShelterDto[]> {
  const api = useResponseApi();
  const load = useCallback(() => api.listShelters(), [api]);
  return useAsyncData(load, refreshKey);
}

export function useRelief(
  refreshKey?: unknown,
): AsyncData<ReliefDistributionDto[]> {
  const api = useResponseApi();
  const load = useCallback(() => api.listRelief(), [api]);
  return useAsyncData(load, refreshKey);
}

export function useDistricts(): AsyncData<DistrictDto[]> {
  const api = useDistrictsApi();
  const load = useCallback(() => api.list(), [api]);
  return useAsyncData(load);
}
