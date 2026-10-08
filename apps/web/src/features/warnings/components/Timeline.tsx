import {
  Ban,
  CircleCheck,
  CircleX,
  Pencil,
  PencilLine,
  RadioTower,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';
import { formatDateTime } from '../format';
import type { TimelineEvent, TimelineKind } from '../timeline';
import { ICON_SIZE } from '../ui';

const ICONS: Record<TimelineKind, LucideIcon> = {
  reported: Smartphone,
  verified: ShieldCheck,
  created: PencilLine,
  published: RadioTower,
  updated: Pencil,
  cancelled: Ban,
  sent: CircleCheck,
  failed: CircleX,
};

// A dated list of events, newest first (incident and audit timelines).
export function Timeline({ events }: { events: readonly TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="px-4 py-5 text-[14px] text-[#4F5B67]">Nothing yet.</p>;
  }
  return (
    <ol className="px-4 pt-1.5 pb-2.5">
      {events.map((event, index) => {
        const Icon = ICONS[event.kind];
        return (
          <li
            key={`${event.at}-${index}`}
            className="grid grid-cols-[28px_112px_minmax(0,1fr)] items-start gap-2.5 border-b border-[#EEF1F4] py-[9px] last:border-b-0"
          >
            <span className="grid size-[26px] place-items-center rounded-full bg-[#E8EFF8] text-[#1D4E89]">
              <Icon aria-hidden size={ICON_SIZE.small} />
            </span>
            <span className="pt-1 font-mono text-[12.5px] text-[#4F5B67]">
              {formatDateTime(event.at)}
            </span>
            <span className="pt-0.5 text-[14px] leading-[1.45]">
              {event.text}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
