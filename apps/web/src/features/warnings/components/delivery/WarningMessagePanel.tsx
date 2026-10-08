import { Ban } from 'lucide-react';
import type { WarningDto } from '@rescue-lk/shared';
import { formatDateTime } from '../../format';
import { ICON_SIZE } from '../../ui';
import { Card } from '../shell/Card';

const instructionLines = (instructions: string) =>
  instructions
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

// What citizens were sent, and why it was cancelled if it was.
export function WarningMessagePanel({ warning }: { warning: WarningDto }) {
  const instructions = instructionLines(warning.instructions);
  return (
    <Card title="Warning message" titleId="warning-message-panel-title">
      <div className="flex flex-col gap-3 p-4">
        <p className="text-[15px] leading-normal whitespace-pre-line">
          {warning.message}
        </p>
        {instructions.length > 0 && (
          <div>
            <div className="mb-1 text-[13px] font-semibold text-[#2E3A46]">
              Safety instructions
            </div>
            <ul className="list-disc pl-5 text-[14px] leading-[1.6]">
              {instructions.map((line, index) => (
                <li key={`${index}-${line}`}>{line}</li>
              ))}
            </ul>
          </div>
        )}
        {warning.status === 'CANCELLED' && (
          <div className="flex items-start gap-2 rounded-[8px] border border-[#D3D9E0] bg-[#EEF1F4] px-3 py-2.5 text-[14px] text-[#46525F]">
            <Ban
              aria-hidden
              size={ICON_SIZE.medium}
              className="mt-0.5 flex-none"
            />
            <span>
              Cancelled {formatDateTime(warning.cancelledAt)}:{' '}
              {warning.cancelReason}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
