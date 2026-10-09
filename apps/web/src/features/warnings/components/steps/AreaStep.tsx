import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import type {
  ReachEstimateDto,
  TargetAreaDto,
  VerifiedHazardReportDto,
  WarningFormErrors,
} from '@rescue-lk/shared';
import type { ApiError } from '@/lib/api-error';
import type { WarningFormValues } from '../../form';
import type { SetFormField } from '../../hooks/useWarningForm';
import { errorBanner } from '../../publishing';
import { AreaSelector } from '../area/AreaSelector';
import { FormErrorBanner } from '../area/FormErrorBanner';
import { MessageFields } from '../area/MessageFields';
import { ReachSummary } from '../area/ReachSummary';
import { ChannelSelector } from '../ChannelSelector';
import { ErrorNotice } from '../ErrorNotice';
import { ActionBar, type ActionSpec } from '../shell/ActionBar';
import { ScreenHeader } from '../shell/ScreenHeader';
import { SummaryStrip } from '../shell/SummaryStrip';
import { editorStrip } from './editorStrip';

// Parameter object: what the step's buttons do.
export interface AreaStepActions {
  onBack: () => void;
  onSaveDraft: () => void;
  onReview: () => void;
}

interface AreaStepProps {
  values: WarningFormValues;
  errors: WarningFormErrors;
  areas: readonly TargetAreaDto[];
  report: VerifiedHazardReportDto | undefined;
  reach: ReachEstimateDto | null;
  editorLabel: string;
  // Updating an ACTIVE warning: no draft option, and "Review update".
  isUpdate: boolean;
  // A failed save or publish that is not about one field (e.g. 409, offline).
  failure: ApiError | null;
  busy: boolean;
  updatedAt: Date | null;
  onFieldChange: SetFormField;
  actions: AreaStepActions;
}

// Step 4 "Area & message": where the warning goes, what it says, and on which
// channels.
// Presentational: form state and saving live in hooks.
// Parameter Object: the buttons come in as one AreaStepActions object instead of
// loose props, so the step's signature stays short and clear.
export function AreaStep({
  values,
  errors,
  areas,
  report,
  reach,
  editorLabel,
  isUpdate,
  failure,
  busy,
  updatedAt,
  onFieldChange,
  actions,
}: AreaStepProps) {
  const banner = errorBanner(errors);
  const right: ActionSpec[] = [
    ...(!isUpdate
      ? [
          {
            label: busy ? 'Saving…' : 'Save as draft',
            icon: Save,
            onClick: actions.onSaveDraft,
            variant: 'secondary' as const,
            disabled: busy,
          },
        ]
      : []),
    {
      label: isUpdate ? 'Review update' : 'Review and publish',
      icon: ArrowRight,
      onClick: actions.onReview,
      variant: 'primary',
      disabled: busy,
    },
  ];

  return (
    <>
      <ScreenHeader
        title="Affected area and warning message"
        subtitle="Choose where the warning goes, write the message and select the channels."
        updatedAt={updatedAt}
      />
      <SummaryStrip cells={editorStrip(values, report, editorLabel)} />
      <FormErrorBanner banner={banner} />
      {!banner && <ErrorNotice error={failure} />}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] items-start gap-4">
        <AreaSelector
          areas={areas}
          value={values.areaIds}
          onChange={(areaIds) => onFieldChange('areaIds', areaIds)}
          error={errors.areaIds}
        />
        <ReachSummary reach={reach} hasAreas={values.areaIds.length > 0} />
        <MessageFields
          message={values.message}
          instructions={values.instructions}
          errors={errors}
          onFieldChange={onFieldChange}
        />
        <ChannelSelector
          value={values.channels}
          onChange={(channels) => onFieldChange('channels', channels)}
          error={errors.channels}
        />
      </div>
      <ActionBar
        left={[
          {
            label: 'Back to warning level',
            icon: ArrowLeft,
            onClick: actions.onBack,
            variant: 'secondary',
          },
        ]}
        right={right}
      />
    </>
  );
}
