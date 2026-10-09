import type { ReactNode } from 'react';
import { cx } from '../../ui';

interface CardProps {
  title: string;
  // Id for the heading, so the section can be labelled by it.
  titleId: string;
  // Extra content in the title bar, e.g. tabs.
  headerExtra?: ReactNode;
  className?: string;
  children: ReactNode;
}

// Card is a white panel with the design's grey title bar.
// DRY: every panel on the screen uses it, so they all look the same and a style
// change is made once.
export function Card({
  title,
  titleId,
  headerExtra,
  className,
  children,
}: CardProps) {
  return (
    <section
      aria-labelledby={titleId}
      className={cx(
        'min-w-0 overflow-hidden rounded-[10px] border border-[#D9DFE5] bg-white',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E1E6EB] bg-[#F3F5F7] px-4">
        <h2 id={titleId} className="py-[11px] text-[15px] font-bold">
          {title}
        </h2>
        {headerExtra}
      </div>
      {children}
    </section>
  );
}
