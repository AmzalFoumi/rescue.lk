import { RotateCcw } from 'lucide-react';
import type { DeliveryRecordDto } from '@rescue-lk/shared';
import { AUTOMATIC_SEND_ATTEMPTS } from '../constants';
import { recipientsLabel } from '../delivery';
import { formatTime } from '../format';
import { CHANNEL_META } from '../meta';
import { cx, ICON_SIZE, ui } from '../ui';
import { Card } from './shell/Card';
import { DeliveryStatusChip } from './StatusChip';

interface DeliveryStatusTableProps {
  records: readonly DeliveryRecordDto[];
  loading: boolean;
  onRetry: (recordId: string) => void;
  retryDisabled?: boolean;
}

const HEADERS = ['Channel', 'Status', 'Attempts', 'Recipients', 'Last try'];
const head =
  'px-4 py-[9px] text-left text-[12px] font-bold tracking-[0.04em] text-[#4F5B67] uppercase';
const cell = 'border-t border-[#E6EAEE] px-4 py-3 align-middle text-[14px]';

// Sequence diagram step 11: delivery status of each channel. Only a FAILED
// delivery offers Retry.
export function DeliveryStatusTable({
  records,
  loading,
  onRetry,
  retryDisabled,
}: DeliveryStatusTableProps) {
  return (
    <Card title="Delivery status by channel" titleId="delivery-status-title">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse">
          <thead>
            <tr>
              {HEADERS.map((header) => (
                <th key={header} scope="col" className={head}>
                  {header}
                </th>
              ))}
              <th scope="col" className={head}>
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const { label, icon: Icon } = CHANNEL_META[record.channel];
              const showError = record.status !== 'SENT' && record.error;
              return (
                <tr key={record.id}>
                  <th scope="row" className={cx(cell, 'text-left font-normal')}>
                    <span className="flex items-center gap-2">
                      <Icon
                        aria-hidden
                        size={ICON_SIZE.large}
                        className="text-[#4F5B67]"
                      />
                      {label}
                    </span>
                  </th>
                  <td className={cell}>
                    <span className="flex flex-col items-start gap-1">
                      <DeliveryStatusChip status={record.status} />
                      {showError && (
                        <span className="text-[12.5px] text-[#9F1D1D]">
                          {record.error}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className={cx(cell, 'font-mono text-[13px]')}>
                    {record.attempts} / {AUTOMATIC_SEND_ATTEMPTS}
                  </td>
                  <td className={cell}>{recipientsLabel(record)}</td>
                  <td className={cx(cell, 'font-mono text-[13px]')}>
                    {record.lastAttemptAt
                      ? formatTime(new Date(record.lastAttemptAt))
                      : '–'}
                  </td>
                  <td className={cell}>
                    {record.status === 'FAILED' && (
                      <button
                        type="button"
                        onClick={() => onRetry(record.id)}
                        disabled={retryDisabled}
                        aria-label={`Retry ${label}`}
                        className={cx(
                          ui.buttonPrimary,
                          'h-8 px-2.5 py-0 text-[13px]',
                        )}
                      >
                        <RotateCcw aria-hidden size={ICON_SIZE.small} />
                        Retry
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {records.length === 0 && (
          <p className="border-t border-[#E6EAEE] px-4 py-5 text-[14px] text-[#4F5B67]">
            {loading
              ? 'Loading delivery status…'
              : 'No deliveries for this warning yet.'}
          </p>
        )}
      </div>
      <p className="border-t border-[#E6EAEE] px-4 py-2.5 text-[12.5px] text-[#4F5B67]">
        Each channel is tried up to {AUTOMATIC_SEND_ATTEMPTS} times
        automatically before it is marked Failed.
      </p>
    </Card>
  );
}
