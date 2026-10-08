import type { VerifiedHazardReportDto } from '@rescue-lk/shared';
import { api } from '@/lib/api';
import { useAsyncResource } from './useAsyncResource';

const loadVerifiedReports = () => api.warnings.verifiedReports();

// Hazard reports a warning can be based on (verified in UC2).
export function useVerifiedReports() {
  return useAsyncResource<VerifiedHazardReportDto[]>(loadVerifiedReports);
}
