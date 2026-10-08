import { useRef, type KeyboardEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cx, ICON_SIZE } from '../../ui';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
  count: number;
}

interface TabsProps<T extends string> {
  label: string;
  // Prefix for tab and panel ids (tab: `${idPrefix}-tab-${id}`).
  idPrefix: string;
  tabs: readonly TabItem<T>[];
  selected: T;
  onSelect: (id: T) => void;
}

export const tabPanelId = (idPrefix: string) => `${idPrefix}-panel`;
export const tabId = (idPrefix: string, id: string) => `${idPrefix}-tab-${id}`;

// ARIA tabs: arrow keys, Home and End move between tabs.
export function Tabs<T extends string>({
  label,
  idPrefix,
  tabs,
  selected,
  onSelect,
}: TabsProps<T>) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const moveTo = (index: number) => {
    const next = (index + tabs.length) % tabs.length;
    onSelect(tabs[next].id);
    buttons.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    if (event.key in moves) {
      event.preventDefault();
      moveTo(moves[event.key]);
    }
  };

  return (
    <div role="tablist" aria-label={label} className="flex gap-1">
      {tabs.map(({ id, label: text, icon: Icon, count }, index) => {
        const active = id === selected;
        return (
          <button
            key={id}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            id={tabId(idPrefix, id)}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={tabPanelId(idPrefix)}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cx(
              'flex h-11 items-center gap-1.5 border-b-[3px] px-2.5 text-[14px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1D4E89]',
              active
                ? 'border-[#1D4E89] text-[#1D4E89]'
                : 'border-transparent text-[#4F5B67] hover:text-[#17212B]',
            )}
          >
            <Icon aria-hidden size={ICON_SIZE.medium} />
            {text}
            <span className="grid h-5 min-w-[22px] place-items-center rounded-[10px] border border-[#D9DFE5] bg-white px-1.5 text-[12px] text-[#2E3A46]">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
