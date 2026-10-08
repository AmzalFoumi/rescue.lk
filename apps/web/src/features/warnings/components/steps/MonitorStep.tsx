import {
  MapPin,
  PencilLine,
  Plus,
  RadioTower,
  TriangleAlert,
} from 'lucide-react';
import type { WarningDto } from '@rescue-lk/shared';
import type { useMonitorScreen } from '../../hooks/useMonitorScreen';
import { ActionBar } from '../shell/ActionBar';
import { KpiCards, type Kpi } from '../shell/KpiCards';
import { ScreenHeader } from '../shell/ScreenHeader';
import { DistrictsUnderWarning } from '../monitor/DistrictsUnderWarning';
import { HazardEventsTable } from '../monitor/HazardEventsTable';
import { MonitorFilters } from '../monitor/MonitorFilters';
import { WarningsPanel } from '../monitor/WarningsPanel';

interface MonitorStepProps {
  screen: ReturnType<typeof useMonitorScreen>;
  areaNames: Record<string, string>;
  updatedAt: Date | null;
  onReview: (reportId: string) => void;
  onOpenWarning: (warning: WarningDto) => void;
  onCreate: () => void;
}

// Step 1: verified reports, their warnings, and where warnings are active.
export function MonitorStep({
  screen,
  areaNames,
  updatedAt,
  onReview,
  onOpenWarning,
  onCreate,
}: MonitorStepProps) {
  const { summary } = screen;
  const kpis: Kpi[] = [
    {
      icon: TriangleAlert,
      label: 'Active hazards',
      value: String(summary.activeHazards),
      detail: `${summary.withoutWarning} without a warning`,
      tone: 'orange',
    },
    {
      icon: RadioTower,
      label: 'Active warnings',
      value: String(summary.activeWarnings),
      detail: `${summary.criticalOrHigh} Critical or High`,
      tone: 'red',
    },
    {
      icon: PencilLine,
      label: 'Draft warnings',
      value: String(summary.drafts),
      detail: 'Saved, not sent to citizens',
      tone: 'blue',
    },
    {
      icon: MapPin,
      label: 'Districts under warning',
      value: String(summary.districts.length),
      detail: summary.districts.join(', ') || 'None',
      tone: 'green',
    },
  ];

  return (
    <>
      <ScreenHeader
        title="Hazard monitoring"
        subtitle="Verified hazard reports and the warnings issued for them. Review a report to issue a warning."
        updatedAt={updatedAt}
      />
      <KpiCards kpis={kpis} />
      <MonitorFilters
        filters={screen.filters}
        districts={screen.districtOptions}
        onChange={screen.changeFilters}
        onReset={screen.resetFilters}
      />
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <HazardEventsTable
          rows={screen.rows}
          total={screen.total}
          onReview={onReview}
        />
        <DistrictsUnderWarning entries={screen.districts} />
      </div>
      <WarningsPanel
        tab={screen.tab}
        counts={screen.counts}
        onTabChange={screen.setTab}
        warnings={screen.tabWarnings}
        deliveries={screen.deliveries}
        areaNames={areaNames}
        onOpen={onOpenWarning}
      />
      <ActionBar
        right={[
          {
            label: 'Create warning',
            icon: Plus,
            onClick: onCreate,
            variant: 'primary',
          },
        ]}
      />
    </>
  );
}
