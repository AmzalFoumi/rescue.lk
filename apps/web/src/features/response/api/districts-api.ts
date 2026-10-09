import type { DistrictDto } from '@rescue-lk/shared';
import { request } from '@/lib/api';
import type { Requester } from './response-api';

/**
 * Districts, so the screens can show a name instead of the id the API stores.
 * Each use case keeps its own small client, so one owner's changes cannot
 * break another's screens.
 */
export interface DistrictsApi {
  list(): Promise<DistrictDto[]>;
}

export function createDistrictsApi(send: Requester = request): DistrictsApi {
  return {
    list: () => send<DistrictDto[]>('/districts'),
  };
}
