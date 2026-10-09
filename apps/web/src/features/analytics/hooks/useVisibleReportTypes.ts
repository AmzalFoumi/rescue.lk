'use client';

import { useEffect, useState } from 'react';
import type { ReportType } from '@rescue-lk/shared/analytics/report.types';
import { getVisibleReportTypes } from '@/lib/api';
import { useDemoRole } from '../context/DemoRoleContext';

export function useVisibleReportTypes(): ReportType[] {
  const { role } = useDemoRole();
  const [types, setTypes] = useState<ReportType[]>([]);

  useEffect(() => {
    let cancelled = false;
    getVisibleReportTypes(role)
      .then((result) => {
        if (!cancelled) setTypes(result);
      })
      .catch(() => {
        if (!cancelled) setTypes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [role]);

  return types;
}
