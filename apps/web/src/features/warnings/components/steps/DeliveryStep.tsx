import {
  ArrowLeft,
  Ban,
  CircleCheck,
  CircleX,
  Pencil,
  RefreshCw,
  Users,
} from 'lucide-react';
import type { DeliveryRecordDto } from '@rescue-lk/shared';
import type { ApiError } from '@/lib/api-error';
import {
  percentLabel,
  type DeliveryKpis,
  type DeliveryView,
} from '../../delivery';
import { formatCount, hazardName, shortId } from '../../format';
import { SEVERITY_META, WARNING_STATUS_META } from '../../meta';
import { DeliveryStatusTable } from '../DeliveryStatusTable';
import { WarningMessagePanel } from '../delivery/WarningMessagePanel';
import { ErrorNotice } from '../ErrorNotice';
import { ActionBar, type ActionSpec } from '../shell/ActionBar';
import { Card } from '../shell/Card';
import { KpiCards, type Kpi } from '../shell/KpiCards';
import { ScreenHeader } from '../shell/ScreenHeader';
import { SummaryStrip } from '../shell/SummaryStrip';
import { Timeline } from '../Timeline';

interface DeliveryStepProps {
  view: DeliveryView;
  loading: boolean;
  retryError: ApiError | null;
  busy: boolean;
  updatedAt: Date | null;
  onBack: () => void;
  onRetry: (recordId: string) => void;
  onRetryAll: (records: readonly DeliveryRecordDto[]) => void;
  onUpdate: () => void;
  onCancel: () => void;
}

const kpisFor = ({
  target,
  delivered,
  pending,
  failed,
}: DeliveryKpis): Kpi[] => [
  {
    icon: Users,
    label: 'Target citizens',
    value: formatCount(target),
    detail: 'SMS and push, all target districts',
    tone: 'blue',
  },
  {
    icon: CircleCheck,
    label: 'Delivered',
    value: formatCount(delivered),
    detail: `Sent${percentLabel(delivered, target)}`,
    tone: 'green',
  },
  {
    icon: RefreshCw,
    label: 'Pending or retrying',
    value: formatCount(pending),
    detail: pending ? `In progress${percentLabel(pending, target)}` : 'None',
    tone: 'amber',
  },
  {
    icon: CircleX,
    label: 'Failed',
    value: formatCount(failed),
    detail: failed ? `Needs a retry${percentLabel(failed, target)}` : 'None',
    tone: 'red',
  },
];

// Step 5: what was sent, to whom, and how each channel did.
export function DeliveryStep({
  view,
  loading,
  retryError,
  busy,
  updatedAt,
  onBack,
  onRetry,
  onRetryAll,
  onUpdate,
  onCancel,
}: DeliveryStepProps) {
  const { warning, records } = view;
  const failed = records.filter((record) => record.status === 'FAILED');
  const right: ActionSpec[] = [];
  if (failed.length > 0) {
    right.push({
      label: `Retry failed channels (${failed.length})`,
      icon: RefreshCw,
      onClick: () => onRetryAll(failed),
      variant: 'primary',
      disabled: busy,
    });
  }
  if (warning.status === 'ACTIVE') {
    right.push(
      {
        label: 'Update warning',
        icon: Pencil,
        onClick: onUpdate,
        variant: 'secondary',
      },
      {
        label: 'Cancel warning',
        icon: Ban,
        onClick: onCancel,
        variant: 'danger',
      },
    );
  }

  return (
    <>
      <ScreenHeader
        title="Warning issued and delivery status"
        subtitle={view.subtitle}
        updatedAt={updatedAt}
      />
      <SummaryStrip
        cells={[
          {
            label: 'Warning ID',
            value: shortId('W', warning.id),
            title: warning.id,
          },
          {
            label: 'Source report',
            value: shortId('R', warning.sourceReportId),
            title: warning.sourceReportId,
          },
          { label: 'Hazard type', value: hazardName(warning) },
          { label: 'Warning level', chip: SEVERITY_META[warning.severity] },
          { label: 'Status', chip: WARNING_STATUS_META[warning.status] },
        ]}
      />
      <KpiCards kpis={kpisFor(view.kpis)} />
      <ErrorNotice error={retryError} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,460px),1fr))] items-start gap-4">
        <DeliveryStatusTable
          records={records}
          loading={loading}
          onRetry={onRetry}
          retryDisabled={busy}
        />
        <Card title="Audit timeline" titleId="audit-timeline-title">
          <Timeline events={view.timeline} />
        </Card>
        <WarningMessagePanel warning={warning} />
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
        right={right}
      />
    </>
  );
}
