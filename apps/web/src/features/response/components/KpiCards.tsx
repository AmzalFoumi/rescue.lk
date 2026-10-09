import type { Kpi } from '../domain/summaries';
import { Icon } from './icons';
import { TONE_CLASSES } from './ui';

/** The four numbers at the top of the Response Operations screen. */
export function KpiCards({ kpis }: { kpis: Kpi[] }) {
  return (
    <div
      role="region"
      aria-label="Response progress"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {kpis.map((kpi) => (
        <div
          key={kpi.key}
          className="flex items-center gap-3.5 rounded-[10px] border border-line bg-white px-4 py-3.5"
        >
          <span
            className={`grid size-11 flex-none place-items-center rounded-[10px] border ${TONE_CLASSES[kpi.tone]}`}
          >
            <Icon name={kpi.icon} className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="text-[13px] font-semibold text-ink-muted">
              {kpi.label}
            </span>
            <span className="text-2xl font-bold leading-tight">
              {kpi.value}
            </span>
            <span className="text-xs text-ink-muted">{kpi.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
