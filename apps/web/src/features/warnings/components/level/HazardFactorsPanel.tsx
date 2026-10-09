import type { ReactNode } from 'react';
import {
  Copy,
  FileCheck,
  House,
  RadioTower,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { HazardFactors } from '../../factors';
import { formatCount } from '../../format';
import { NotConnected, SOURCES } from '../NotConnected';
import { Card } from '../shell/Card';

interface HazardFactorsPanelProps {
  // Null until a source report is chosen.
  factors: HazardFactors | null;
  // Expected SMS reach in the report's district, when known.
  smsReach: number | null;
}

interface FactorRow {
  icon: LucideIcon;
  label: string;
  detail: ReactNode;
  value: string;
}

const FACTOR_ICON_SIZE = 18;
const UNKNOWN = '—';

const rowsFor = (
  { district, sameDay, activeWarnings }: HazardFactors,
  smsReach: number | null,
): FactorRow[] => [
  {
    icon: FileCheck,
    label: 'Other verified reports, same district and day',
    detail: sameDay.ids,
    value: String(sameDay.count),
  },
  {
    icon: Copy,
    label: 'Possible duplicates',
    detail: <NotConnected source={SOURCES.hazardReports} />,
    value: UNKNOWN,
  },
  {
    icon: RadioTower,
    label: `Active warnings covering ${district}`,
    detail: activeWarnings.list,
    value: String(activeWarnings.count),
  },
  {
    icon: House,
    label: `Free shelter places in ${district}`,
    detail: <NotConnected source={SOURCES.response} />,
    value: UNKNOWN,
  },
  {
    icon: Users,
    label: `Mobile subscribers in ${district}`,
    detail: 'Reachable by SMS',
    value: smsReach === null ? UNKNOWN : formatCount(smsReach),
  },
  {
    icon: Truck,
    label: `Rescue teams in ${district}`,
    detail: <NotConnected source={SOURCES.response} />,
    value: UNKNOWN,
  },
];

// HazardFactorsPanel shows the step 3 hazard factors: what UC1 can work out itself
// about the report's district (factors.ts).
// Presentational. Data owned by UC2 and UC3 is marked as not connected, never invented.
export function HazardFactorsPanel({
  factors,
  smsReach,
}: HazardFactorsPanelProps) {
  return (
    <Card title="Hazard factors" titleId="hazard-factors-title">
      {factors ? (
        <ul>
          {rowsFor(factors, smsReach).map(
            ({ icon: Icon, label, detail, value }) => (
              <li
                key={label}
                className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[#EEF1F4] px-4 py-[11px] last:border-b-0"
              >
                <span className="grid size-9 place-items-center rounded-[8px] bg-[#E8EFF8] text-[#1D4E89]">
                  <Icon aria-hidden size={FACTOR_ICON_SIZE} />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[14px] font-semibold">{label}</span>
                  <span className="text-[12.5px] text-[#4F5B67]">{detail}</span>
                </span>
                <span className="font-mono text-[18px] font-bold">{value}</span>
              </li>
            ),
          )}
        </ul>
      ) : (
        <p className="px-4 py-5 text-[14px] text-[#4F5B67]">
          Select a source report to see its hazard factors.
        </p>
      )}
    </Card>
  );
}
