'use client';

import { useState } from 'react';
import type { ReportRequest } from '@/lib/api';

export function useAnalyticsFilters() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [district, setDistrict] = useState<string>('All districts');
  const [hazardType, setHazardType] = useState<string>('All hazards');

  const buildRequest = (): Omit<ReportRequest, 'type'> => {
    return {
      from,
      to,
      district: district === 'All districts' ? undefined : district,
      hazardType: hazardType === 'All hazards' ? undefined : hazardType,
    };
  };

  return {
    from,
    setFrom,
    to,
    setTo,
    district,
    setDistrict,
    hazardType,
    setHazardType,
    buildRequest,
  };
}
