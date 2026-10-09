import { Unplug } from 'lucide-react';
import { ICON_SIZE } from '../ui';

// Who will supply data that UC1 does not own yet.
export const SOURCES = {
  hazardReports: 'Hazard Reports (UC2)',
  response: 'Response Coordination (UC3)',
} as const;

// NotConnected marks information another use case (UC2 or UC3) will provide.
// DRY: every screen marks missing data the same way, instead of inventing numbers.
// Presentational; SOURCES names who will supply each piece of data.
export function NotConnected({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-[#4F5B67] italic">
      <Unplug aria-hidden size={ICON_SIZE.small} />
      Provided by {source} once connected
    </span>
  );
}
