import type { DistrictDto } from '@rescue-lk/shared';
import { request } from '@/lib/api';
import type { Requester } from './hazard-reports-api';

export interface DistrictsApi {
  list(): Promise<DistrictDto[]>;
}

export function createDistrictsApi(send: Requester = request): DistrictsApi {
  return {
    list: () => send<DistrictDto[]>('/districts'),
  };
}
