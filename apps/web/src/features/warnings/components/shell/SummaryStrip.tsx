import type { TonedMeta } from '../../meta';
import { StatusChip } from '../StatusChip';

export interface SummaryCell {
  label: string;
  // Plain value, or a status chip when the value is a status.
  value?: string;
  chip?: TonedMeta;
  // Full value for a tooltip, e.g. a complete id behind a short one.
  title?: string;
}

// SummaryStrip is the row of key facts under a step's title.
// DRY: shared by steps 2 to 5; each step only supplies its cells.
export function SummaryStrip({ cells }: { cells: readonly SummaryCell[] }) {
  return (
    <dl className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] overflow-hidden rounded-[10px] border border-[#D9DFE5] bg-white">
      {cells.map(({ label, value, chip, title }) => (
        <div
          key={label}
          className="flex min-w-0 flex-col items-start gap-[5px] border-r border-[#E6EAEE] px-[18px] py-3 last:border-r-0"
        >
          <dt className="text-[12px] font-semibold text-[#4F5B67]">{label}</dt>
          <dd
            className="max-w-full truncate text-[16px] font-bold"
            title={title}
          >
            {chip ? <StatusChip {...chip} /> : value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
