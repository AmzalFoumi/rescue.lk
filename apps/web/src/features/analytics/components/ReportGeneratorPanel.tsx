'use client';

import { useState } from 'react';
import type { ReportType } from '@rescue-lk/shared/analytics/report.types';
import { useVisibleReportTypes } from '../hooks/useVisibleReportTypes';
import { useReportGenerator } from '../hooks/useReportGenerator';
import { ReportTypeCard } from './ReportTypeCard';
import { ReportPreviewTable } from './ReportPreviewTable';
import { ExportButtons } from './ExportButtons';
import type { AnalyticsFiltersState } from './AnalyticsFilterBar';
import { Button, StateMessage } from '../../response/components/ui';

interface ReportGeneratorPanelProps {
  filters: AnalyticsFiltersState;
}

export function ReportGeneratorPanel({ filters }: ReportGeneratorPanelProps) {
  const visibleTypes = useVisibleReportTypes();
  const { report, isLoading, error, generate, exportAs } = useReportGenerator();
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);

  const handleGenerate = () => {
    if (!selectedType) return;

    generate(selectedType, {
      from: filters.from,
      to: filters.to,
      district:
        filters.district === 'All districts' ? undefined : filters.district,
      hazardType:
        filters.hazardType === 'All hazards' ? undefined : filters.hazardType,
    });
  };

  const handleExport = (format: 'PDF' | 'CSV') => {
    if (!selectedType) return;

    exportAs(selectedType, format, {
      from: filters.from,
      to: filters.to,
      district:
        filters.district === 'All districts' ? undefined : filters.district,
      hazardType:
        filters.hazardType === 'All hazards' ? undefined : filters.hazardType,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 text-[15px] font-bold text-ink">
          1. Select Report Type
        </h2>
        {visibleTypes.length === 0 ? (
          <StateMessage
            kind="empty"
            message="No reports available for your role."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleTypes.map((type) => (
              <ReportTypeCard
                key={type}
                type={type}
                isSelected={selectedType === type}
                onSelect={() => setSelectedType(type)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center border-t border-line pt-8">
        <Button
          variant="primary"
          onClick={handleGenerate}
          disabled={!selectedType || isLoading}
          className="min-w-[200px]"
        >
          {isLoading ? 'Generating...' : 'Generate Report Preview'}
        </Button>
      </div>

      {error && <StateMessage kind="error" message={error} />}

      <div>
        <h2 className="mb-4 text-[15px] font-bold text-ink">
          2. Preview & Export
        </h2>
        <ReportPreviewTable report={report} />

        <ExportButtons
          isDisabled={!report}
          isExporting={isLoading}
          onExport={handleExport}
        />
      </div>
    </div>
  );
}
