import { useDemoRole } from '../context/DemoRoleContext';
import { AnalyticsTab, TABS_BY_ROLE } from '../config/role-view.config';
import { LayoutDashboard, Radio, Home, Box, FileBarChart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface AnalyticsTabsProps {
  activeTab: AnalyticsTab;
  onTabChange: (tab: AnalyticsTab) => void;
}

const TAB_CONFIG: Record<AnalyticsTab, { label: string; icon: LucideIcon }> = {
  overview: { label: 'Overview', icon: LayoutDashboard },
  alertsReach: { label: 'Alerts & Reach', icon: Radio },
  shelters: { label: 'Shelter Occupancy', icon: Home },
  resources: { label: 'Resource Distribution', icon: Box },
  reportGenerator: { label: 'Report Generator', icon: FileBarChart },
};

export function AnalyticsTabs({ activeTab, onTabChange }: AnalyticsTabsProps) {
  const { role } = useDemoRole();
  const tabs = TABS_BY_ROLE[role] || [];

  return (
    <div
      role="tablist"
      aria-label="Analytics views"
      className="mb-6 flex gap-1 overflow-x-auto border-b border-line"
    >
      {tabs.map((tab) => {
        const config = TAB_CONFIG[tab];
        const selected = tab === activeTab;
        const Icon = config.icon;

        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onTabChange(tab)}
            className={`flex h-11 flex-none items-center gap-2 border-b-[3px] px-3 text-[13px] font-semibold transition-colors ${
              selected
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Icon className="size-4" />
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
