'use client';

import { useState } from 'react';
import { generateReport, exportReport, type ReportRequest } from '@/lib/api';
import { useDemoRole } from '../context/DemoRoleContext';
import type {
  ExportFormat,
  ReportType,
  TabularReportData,
} from '@rescue-lk/shared/analytics/report.types';
import { downloadBlob } from '@/lib/download';

export function useReportGenerator() {
  const { role } = useDemoRole();
  const [report, setReport] = useState<TabularReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (
    type: ReportType,
    filters: Omit<ReportRequest, 'type'>,
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await generateReport({ type, ...filters }, role);
      setReport(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const exportAs = async (
    type: ReportType,
    format: ExportFormat,
    filters: Omit<ReportRequest, 'type'>,
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const blob = await exportReport({ type, format, ...filters }, role);
      const extension = format === 'CSV' ? 'csv' : 'pdf';
      const fileName = `${type.toLowerCase().replaceAll('_', '-')}.${extension}`;
      downloadBlob(blob, fileName);
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : `Failed to export as ${format}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return { report, isLoading, error, generate, exportAs };
}
