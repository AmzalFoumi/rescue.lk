import type {
  DeliveryStatus,
  WarningSeverity,
  WarningStatus,
} from '@rescue-lk/shared';
import {
  DELIVERY_STATUS_META,
  SEVERITY_META,
  TONE_CLASSES,
  WARNING_STATUS_META,
  type TonedMeta,
} from '../meta';
import { cx, ICON_SIZE } from '../ui';

// StatusChip is a status pill: icon + text + colour, so colour is never the only
// signal.
// DRY: the severity, warning status and delivery chips below all reuse it, so every
// status on the screen looks and reads the same.
export function StatusChip({ label, icon: Icon, tone }: TonedMeta) {
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] font-semibold',
        TONE_CLASSES[tone],
      )}
    >
      <Icon aria-hidden size={ICON_SIZE.small} />
      {label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: WarningSeverity }) {
  return <StatusChip {...SEVERITY_META[severity]} />;
}

export function WarningStatusChip({ status }: { status: WarningStatus }) {
  return <StatusChip {...WARNING_STATUS_META[status]} />;
}

export function DeliveryStatusChip({ status }: { status: DeliveryStatus }) {
  return <StatusChip {...DELIVERY_STATUS_META[status]} />;
}
