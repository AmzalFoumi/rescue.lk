import type { LucideIcon } from 'lucide-react';
import { TONE_CLASSES, type Tone } from '../../meta';
import { cx } from '../../ui';

export interface Kpi {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone: Tone;
}

const KPI_ICON_SIZE = 22;

// KpiCards shows a row of key figures with icons.
// Presentational and reusable: each step decides its own figures (monitoring.ts and
// delivery.ts), this only lays them out.
export function KpiCards({ kpis }: { kpis: readonly Kpi[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
      {kpis.map(({ icon: Icon, label, value, detail, tone }) => (
        <div
          key={label}
          className="flex items-center gap-3.5 rounded-[10px] border border-[#D9DFE5] bg-white px-4 py-3.5"
        >
          <span
            className={cx(
              'grid size-11 flex-none place-items-center rounded-[10px] border-0',
              TONE_CLASSES[tone],
            )}
          >
            <Icon aria-hidden size={KPI_ICON_SIZE} />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[13px] font-semibold text-[#4F5B67]">
              {label}
            </span>
            <span className="text-[26px] leading-[1.1] font-bold tracking-[-0.01em]">
              {value}
            </span>
            <span className="truncate text-[12.5px] text-[#4F5B67]">
              {detail}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
