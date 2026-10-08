import type { LucideIcon } from 'lucide-react';
import { ICON_SIZE, ui } from '../../ui';

export interface ActionSpec {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

const VARIANT_CLASS: Record<ActionSpec['variant'], string> = {
  primary: ui.buttonPrimary,
  secondary: ui.buttonSecondary,
  danger: ui.buttonDanger,
};

function ActionButtons({ actions }: { actions: readonly ActionSpec[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(({ label, icon: Icon, onClick, variant, disabled }) => (
        <button
          key={label}
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={VARIANT_CLASS[variant]}
        >
          <Icon aria-hidden size={ICON_SIZE.medium} />
          {label}
        </button>
      ))}
    </div>
  );
}

interface ActionBarProps {
  left?: readonly ActionSpec[];
  right?: readonly ActionSpec[];
}

// The bar under each step: going back on the left, the next action on the right.
export function ActionBar({ left = [], right = [] }: ActionBarProps) {
  if (left.length === 0 && right.length === 0) {
    return null;
  }
  return (
    <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#D9DFE5] bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(23,33,43,0.06)]">
      <ActionButtons actions={left} />
      <ActionButtons actions={right} />
    </div>
  );
}
