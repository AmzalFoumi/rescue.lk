'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, House, Plus, type LucideIcon } from 'lucide-react';
import { ROUTES } from '../routes';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: ROUTES.home, label: 'Home', icon: House },
  { href: ROUTES.newReport, label: 'Report', icon: Plus },
  { href: ROUTES.myReports, label: 'My Reports', icon: ClipboardList },
];

/** The tab bar at the bottom of the citizen screens. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Citizen app"
      className="fixed inset-x-0 bottom-0 border-t border-line bg-white"
    >
      <ul className="mx-auto flex max-w-md">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <li key={href} className="flex-1">
            <Link
              href={href}
              aria-current={pathname === href ? 'page' : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${
                pathname === href ? 'text-primary' : 'text-ink-muted'
              }`}
            >
              <Icon aria-hidden className="size-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
