import { Clock } from 'lucide-react';
import { formatTime } from '../../format';
import { ICON_SIZE } from '../../ui';

interface ScreenHeaderProps {
  title: string;
  subtitle: string;
  updatedAt: Date | null;
}

// ScreenHeader shows the title of the current step and when its data was last
// refreshed. Presentational; shared by every step (DRY).
export function ScreenHeader({
  title,
  subtitle,
  updatedAt,
}: ScreenHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[24px] font-bold tracking-[-0.01em]">{title}</h1>
        <p className="mt-1 max-w-[780px] text-[14px] leading-normal text-[#4F5B67]">
          {subtitle}
        </p>
      </div>
      {updatedAt && (
        <span className="flex items-center gap-2 rounded-[8px] border border-[#D9DFE5] bg-white px-3 py-2 text-[13px] text-[#2E3A46]">
          <Clock aria-hidden size={ICON_SIZE.small} />
          Last updated {formatTime(updatedAt)}
        </span>
      )}
    </div>
  );
}
