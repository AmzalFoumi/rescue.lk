import type { ReactNode } from 'react';
import {
  House,
  MessageSquareText,
  Siren,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';
import type { ReachEstimateDto } from '@rescue-lk/shared';
import { formatCount } from '../../format';
import { reachFor } from '../../publishing';
import { NotConnected, SOURCES } from '../NotConnected';
import { Card } from '../shell/Card';

interface ReachSummaryProps {
  // Null while no area is selected or the estimate is loading.
  reach: ReachEstimateDto | null;
  hasAreas: boolean;
}

const REACH_ICON_SIZE = 20;
const UNKNOWN = '—';

const count = (value: number | null) =>
  value === null ? UNKNOWN : formatCount(value);

// ReachSummary is "2. Target citizen summary": the expected reach of each channel for
// the selected areas, from the API.
// Presentational. Shelter places belong to UC3, so they are marked as not connected
// rather than invented.
export function ReachSummary({ reach, hasAreas }: ReachSummaryProps) {
  const items: [LucideIcon, string, ReactNode][] = [
    [MessageSquareText, 'SMS recipients', count(reachFor(reach, 'SMS'))],
    [Smartphone, 'App users (push)', count(reachFor(reach, 'PUSH'))],
    [Siren, 'Siren towers', count(reachFor(reach, 'SIREN'))],
    [
      House,
      'Shelters with free places',
      <NotConnected key="shelters" source={SOURCES.response} />,
    ],
  ];

  return (
    <Card title="2. Target citizen summary" titleId="reach-summary-title">
      <ul className="grid grid-cols-2 gap-4 p-4">
        {items.map(([Icon, label, value]) => (
          <li key={label} className="flex items-start gap-2.5">
            <Icon
              aria-hidden
              size={REACH_ICON_SIZE}
              className="mt-0.5 flex-none text-[#1D4E89]"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-[12.5px] text-[#4F5B67]">{label}</span>
              <span className="text-[20px] font-bold">{value}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="px-4 pb-3.5 text-[13px] text-[#4F5B67]" aria-live="polite">
        {hasAreas && reach?.districts.length
          ? `Covers ${reach.districts.join(', ')}.`
          : 'Select at least one district or river basin.'}
      </p>
    </Card>
  );
}
