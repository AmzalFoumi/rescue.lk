import { Unplug } from 'lucide-react';
import { ICON_SIZE } from '../ui';

// Who will supply data that UC1 does not own yet.
export const SOURCES = {
  hazardReports: 'Hazard Reports (UC2)',
  response: 'Response Coordination (UC3)',
} as const;

// Marks information another use case will provide, instead of inventing it.
export function NotConnected({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-[#4F5B67] italic">
      <Unplug aria-hidden size={ICON_SIZE.small} />
      Provided by {source} once connected
    </span>
  );
}
