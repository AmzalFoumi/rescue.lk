import {
  ChartColumn,
  RadioTower,
  ShieldCheck,
  Smartphone,
  Truck,
  type LucideIcon,
} from 'lucide-react';

// appNav.ts is the header's main navigation as data: one group per use case, each
// with its screens, as in the design.
// DRY + OCP: AppHeader only loops over this list, so a new screen or use case is
// one more entry here and the component never changes.
// Static for now: the signed-in officer is an Assessment Officer, so only the UC1
// screen is open; the others are shown locked, as the design does for this role.

export interface AppNavItem {
  label: string;
  icon: LucideIcon;
  // Only screens this role may open have a link.
  href?: string;
  current?: boolean;
}

export interface AppNavGroup {
  code: string;
  name: string;
  items: readonly AppNavItem[];
}

export const APP_NAV: readonly AppNavGroup[] = [
  {
    code: 'UC1',
    name: 'Warning Management',
    items: [
      {
        label: 'Warning Management',
        icon: RadioTower,
        href: '/warnings',
        current: true,
      },
    ],
  },
  {
    code: 'UC2',
    name: 'Hazard Reporting',
    items: [
      { label: 'Citizen App', icon: Smartphone },
      { label: 'Verify Reports', icon: ShieldCheck },
    ],
  },
  {
    code: 'UC3',
    name: 'Response Coordination',
    items: [{ label: 'Response Operations', icon: Truck }],
  },
  {
    code: 'UC4',
    name: 'Disaster Analytics',
    items: [{ label: 'Analytics & Reports', icon: ChartColumn }],
  },
];
