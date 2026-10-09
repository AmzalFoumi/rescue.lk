import type { IconName } from '../domain/presentation';
import { Icon } from './icons';

export type ResponseTab = 'overview' | 'dispatch' | 'shelters' | 'relief';

const TABS: Array<{ id: ResponseTab; label: string; icon: IconName }> = [
  { id: 'overview', label: 'Overview', icon: 'triangle-alert' },
  { id: 'dispatch', label: 'Dispatch team', icon: 'truck' },
  { id: 'shelters', label: 'Shelters', icon: 'house' },
  { id: 'relief', label: 'Relief distribution', icon: 'circle-check' },
];

export function ResponseTabs({
  active,
  onChange,
}: {
  active: ResponseTab;
  onChange: (tab: ResponseTab) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Response operations"
      className="flex gap-1 overflow-x-auto border-b border-line"
    >
      {TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`flex h-11 flex-none items-center gap-2 border-b-[3px] px-3 text-sm font-semibold ${
              selected
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Icon name={tab.icon} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
