import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface HomeTileProps {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

/** A big tappable tile on the citizen Home screen. */
export function HomeTile({ href, icon: Icon, title, subtitle }: HomeTileProps) {
  return (
    <Link
      href={href}
      className="flex min-h-28 flex-col gap-2 rounded-[10px] border border-line bg-white p-4 hover:border-primary"
    >
      <Icon aria-hidden className="size-7 text-primary" />
      <span className="font-semibold">{title}</span>
      <span className="text-sm text-ink-muted">{subtitle}</span>
    </Link>
  );
}
