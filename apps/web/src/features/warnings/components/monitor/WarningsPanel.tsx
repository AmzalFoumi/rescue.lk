import { ChevronRight } from 'lucide-react';
import type { WarningDto, WarningStatus } from '@rescue-lk/shared';
import { areaSummary, formatDateTime, hazardName, shortId } from '../../format';
import type { DeliveriesByWarning } from '../../hooks/useDeliveriesByWarning';
import { WARNING_STATUSES, WARNING_STATUS_META } from '../../meta';
import { cx, ICON_SIZE, ui } from '../../ui';
import { DeliveryChips } from '../DeliveryChips';
import { Card } from '../shell/Card';
import { Tabs, tabId, tabPanelId, type TabItem } from '../shell/Tabs';
import { SeverityBadge } from '../StatusChip';

interface WarningsPanelProps {
  tab: WarningStatus;
  counts: Record<WarningStatus, number>;
  onTabChange: (tab: WarningStatus) => void;
  warnings: readonly WarningDto[];
  deliveries: DeliveriesByWarning | null;
  areaNames: Record<string, string>;
  onOpen: (warning: WarningDto) => void;
}

const TAB_ORDER: WarningStatus[] = ['ACTIVE', 'DRAFT', 'CANCELLED'];
const ID_PREFIX = 'warning-tabs';

const timeLabel = (warning: WarningDto) => {
  if (warning.status === 'DRAFT') {
    return `Draft saved ${formatDateTime(warning.updatedAt ?? warning.createdAt)}`;
  }
  if (warning.status === 'CANCELLED') {
    return `Cancelled ${formatDateTime(warning.cancelledAt)}`;
  }
  const updated = warning.updatedAt
    ? ` · updated ${formatDateTime(warning.updatedAt)}`
    : '';
  return `Published ${formatDateTime(warning.publishedAt)}${updated}`;
};

// WarningsPanel shows warnings by status in tabs, each row with its delivery chips.
// Presentational: props in, open events out.
// DRY: it reuses the shared Card, Tabs, SeverityBadge and DeliveryChips.
export function WarningsPanel({
  tab,
  counts,
  onTabChange,
  warnings,
  deliveries,
  areaNames,
  onOpen,
}: WarningsPanelProps) {
  const tabs: TabItem<WarningStatus>[] = TAB_ORDER.filter((status) =>
    WARNING_STATUSES.includes(status),
  ).map((status) => ({
    id: status,
    label: WARNING_STATUS_META[status].label,
    icon: WARNING_STATUS_META[status].icon,
    count: counts[status],
  }));

  return (
    <Card
      title="Warnings"
      titleId="warnings-title"
      headerExtra={
        <Tabs
          label="Warning status"
          idPrefix={ID_PREFIX}
          tabs={tabs}
          selected={tab}
          onSelect={onTabChange}
        />
      }
    >
      <div
        id={tabPanelId(ID_PREFIX)}
        role="tabpanel"
        aria-labelledby={tabId(ID_PREFIX, tab)}
      >
        {warnings.map((warning) => (
          <div
            key={warning.id}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 border-b border-[#E6EAEE] px-4 py-3 last:border-b-0"
          >
            <span className="flex min-w-0 flex-[1_1_300px] flex-col gap-1.5">
              <span className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={warning.severity} />
                <span className="text-[14px] font-semibold">
                  {hazardName(warning)} ·{' '}
                  {areaSummary(warning.areaIds, areaNames)}
                </span>
              </span>
              <span className="text-[13px] text-[#4F5B67]">
                <span className="font-mono" title={warning.id}>
                  {shortId('W', warning.id)}
                </span>{' '}
                · from{' '}
                <span className="font-mono" title={warning.sourceReportId}>
                  {shortId('R', warning.sourceReportId)}
                </span>{' '}
                · {timeLabel(warning)}
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-1.5">
              <DeliveryChips records={deliveries?.[warning.id] ?? []} />
              <button
                type="button"
                onClick={() => onOpen(warning)}
                className={cx(
                  ui.buttonSecondary,
                  'h-8 px-2.5 py-0 text-[13px] text-[#1D4E89]',
                )}
              >
                {warning.status === 'DRAFT' ? 'Open draft' : 'Delivery status'}
                <ChevronRight aria-hidden size={ICON_SIZE.small} />
              </button>
            </span>
          </div>
        ))}
        {warnings.length === 0 && (
          <p className="px-4 py-6 text-center text-[14px] text-[#4F5B67]">
            No {WARNING_STATUS_META[tab].label.toLowerCase()} warnings.
          </p>
        )}
      </div>
    </Card>
  );
}
