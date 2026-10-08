import { ArrowLeft, ArrowRight } from 'lucide-react';
import type {
  VerifiedHazardReportDto,
  WarningFormErrors,
} from '@rescue-lk/shared';
import type { HazardFactors } from '../../factors';
import type { WarningFormValues } from '../../form';
import type { SetFormField } from '../../hooks/useWarningForm';
import { AssessmentPanel } from '../level/AssessmentPanel';
import { HazardFactorsPanel } from '../level/HazardFactorsPanel';
import { ActionBar } from '../shell/ActionBar';
import { ScreenHeader } from '../shell/ScreenHeader';
import { SummaryStrip } from '../shell/SummaryStrip';
import { editorStrip } from './editorStrip';

interface LevelStepProps {
  values: WarningFormValues;
  errors: WarningFormErrors;
  reports: readonly VerifiedHazardReportDto[];
  // The chosen source report, once loaded.
  report: VerifiedHazardReportDto | undefined;
  factors: HazardFactors | null;
  smsReach: number | null;
  // "New warning", "Draft W-…" or "Updating W-…".
  editorLabel: string;
  sourceLocked: boolean;
  updatedAt: Date | null;
  onSourceChange: (reportId: string) => void;
  onFieldChange: SetFormField;
  onBack: () => void;
  onContinue: () => void;
}

// Step 3: confirm the source report and hazard, then choose the level.
export function LevelStep({
  values,
  errors,
  reports,
  report,
  factors,
  smsReach,
  editorLabel,
  sourceLocked,
  updatedAt,
  onSourceChange,
  onFieldChange,
  onBack,
  onContinue,
}: LevelStepProps) {
  return (
    <>
      <ScreenHeader
        title="Warning level selection"
        subtitle="Confirm the source report and hazard type, then choose the warning level."
        updatedAt={updatedAt}
      />
      <SummaryStrip cells={editorStrip(values, report, editorLabel)} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] items-start gap-4">
        <HazardFactorsPanel factors={factors} smsReach={smsReach} />
        <AssessmentPanel
          values={values}
          errors={errors}
          reports={reports}
          sourceLocked={sourceLocked}
          onSourceChange={onSourceChange}
          onFieldChange={onFieldChange}
        />
      </div>
      <ActionBar
        left={[
          {
            label: 'Back',
            icon: ArrowLeft,
            onClick: onBack,
            variant: 'secondary',
          },
        ]}
        right={[
          {
            label: 'Continue to affected area',
            icon: ArrowRight,
            onClick: onContinue,
            variant: 'primary',
          },
        ]}
      />
    </>
  );
}
