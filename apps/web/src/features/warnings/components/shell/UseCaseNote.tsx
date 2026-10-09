import { UserRound } from 'lucide-react';
import { ICON_SIZE } from '../../ui';

// UseCaseNote is the use-case banner above the UC1 screen, as in the design.
// Presentational.
export function UseCaseNote() {
  return (
    <div
      role="note"
      aria-label="Use case"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] border border-[#BFD2EC] bg-[#E8EFF8] px-4 py-2.5 text-[13px] text-[#1C4E8C]"
    >
      <span className="rounded-[4px] bg-[#1D4E89] px-2 py-0.5 font-mono text-[12px] font-medium text-white">
        UC1
      </span>
      <span className="text-[14px] font-bold text-[#17212B]">
        Warning Management
      </span>
      <span className="min-w-0 flex-[1_1_320px] text-[#2E3A46]">
        UC-001 Issue Disaster Warning · Update Disaster Warning · Cancel
        Disaster Warning · Monitor Warning Delivery
      </span>
      <span className="flex items-center gap-1.5 text-[#2E3A46]">
        <UserRound aria-hidden size={ICON_SIZE.small} />
        Owner: Rimasha M. R. F.
      </span>
    </div>
  );
}
