import { ArrowLeft, ArrowRight, PencilLine, RadioTower } from 'lucide-react';
import type { WarningDto } from '@rescue-lk/shared';
import { shortId } from '../../format';
import { HAZARD_META, SEVERITY_META, VERIFIED_REPORT_META } from '../../meta';
import type { ReviewView } from '../../review';
import { EvidencePanel } from '../review/EvidencePanel';
import { HazardOverview } from '../review/HazardOverview';
import { LinkedWarnings } from '../review/LinkedWarnings';
import { ActionBar, type ActionSpec } from '../shell/ActionBar';
import { Card } from '../shell/Card';
import { ScreenHeader } from '../shell/ScreenHeader';
import { SummaryStrip } from '../shell/SummaryStrip';
import { Timeline } from '../Timeline';

interface ReviewStepProps {
  view: ReviewView;
  areaNames: Record<string, string>;
  updatedAt: Date | null;
  onBack: () => void;
  onOpenWarning: (warning: WarningDto) => void;
  onProceed: (reportId: string) => void;
}

// An existing warning is continued rather than duplicated.
const nextAction = (
  { report, current }: ReviewView,
  onOpenWarning: (warning: WarningDto) => void,
  onProceed: (reportId: string) => void,
): ActionSpec => {
  if (!current) {
    return {
      label: 'Proceed to warning level',
      icon: ArrowRight,
      onClick: () => onProceed(report.id),
      variant: 'primary',
    };
  }
  const id = shortId('W', current.id);
  const isDraft = current.status === 'DRAFT';
  return {
    label: isDraft ? `Open draft ${id}` : `View ${id} delivery`,
    icon: isDraft ? PencilLine : RadioTower,
    onClick: () => onOpenWarning(current),
    variant: 'primary',
  };
};

// Step 2: check the verified report and its evidence before warning.
export function ReviewStep({
  view,
  areaNames,
  updatedAt,
  onBack,
  onOpenWarning,
  onProceed,
}: ReviewStepProps) {
  const { report, current } = view;

  const next = nextAction(view, onOpenWarning, onProceed);

  return (
    <>
      <ScreenHeader
        title="Hazard review"
        subtitle="Check the verified report and its evidence before deciding on a warning."
        updatedAt={updatedAt}
      />
      <SummaryStrip
        cells={[
          {
            label: 'Report ID',
            value: shortId('R', report.id),
            title: report.id,
          },
          { label: 'Hazard type', value: HAZARD_META[report.hazardType].label },
          { label: 'District', value: report.districtName },
          current
            ? { label: 'Severity', chip: SEVERITY_META[current.severity] }
            : { label: 'Severity', value: 'Not assessed' },
          { label: 'Report status', chip: VERIFIED_REPORT_META },
        ]}
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-4">
        <HazardOverview report={report} />
        <EvidencePanel report={report} sameDay={view.sameDay} />
        <Card title="Incident timeline" titleId="incident-timeline-title">
          <Timeline events={view.timeline} />
        </Card>
        <LinkedWarnings
          warnings={view.linked}
          areaNames={areaNames}
          onOpen={onOpenWarning}
        />
      </div>
      <ActionBar
        left={[
          {
            label: 'Back to monitoring',
            icon: ArrowLeft,
            onClick: onBack,
            variant: 'secondary',
          },
        ]}
        right={[next]}
      />
    </>
  );
}
