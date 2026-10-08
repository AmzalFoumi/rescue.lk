import { CircleAlert } from 'lucide-react';
import type { ErrorBanner } from '../../publishing';
import { ICON_SIZE } from '../../ui';

// FormErrorBanner says "2 fields need attention" at the top of step 4.
// It also names any invalid field that is on the warning level step, so the officer
// knows to go back. Presentational: the banner is worked out in publishing.ts.
export function FormErrorBanner({ banner }: { banner: ErrorBanner | null }) {
  if (!banner) {
    return null;
  }
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-[8px] border border-[#EFC4C4] bg-[#FCEDED] px-3 py-2.5 text-[14px] font-semibold text-[#9F1D1D]"
    >
      <CircleAlert
        aria-hidden
        size={ICON_SIZE.large}
        className="mt-px flex-none"
      />
      <span className="flex flex-col gap-0.5">
        {banner.title}
        {banner.elsewhere.length > 0 && (
          <span className="font-normal">
            On the warning level step: {banner.elsewhere.join(', ')}.
          </span>
        )}
      </span>
    </div>
  );
}
