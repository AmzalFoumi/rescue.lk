import Link from 'next/link';
import {
  ALargeSmall,
  CircleUserRound,
  Languages,
  LifeBuoy,
  Lock,
} from 'lucide-react';
import { APP_NAV, type AppNavGroup, type AppNavItem } from '../../appNav';
import { SIGNED_IN_USER } from '../../constants';
import { cx, ICON_SIZE } from '../../ui';

const BRAND_ICON_SIZE = 19;
const USER_ICON_SIZE = 22;
const LOCK_ICON_SIZE = 12;

// The design's languages; only English exists so far, so the control is static.
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'si', label: 'සිංහල' },
  { value: 'ta', label: 'தமிழ்' },
] as const;

const NOT_YET = 'Not available yet';
const LOCKED = `Not available for the ${SIGNED_IN_USER.role} role`;

const control =
  'h-[34px] rounded-[6px] border border-[#C5CDD6] bg-white text-[13px] text-[#17212B] disabled:cursor-not-allowed disabled:opacity-70';

const itemClass =
  'flex h-[46px] items-center gap-[7px] whitespace-nowrap border-b-[3px] px-2 text-[14px] no-underline';

function NavItem({ label, icon: Icon, href, current }: AppNavItem) {
  if (!href) {
    return (
      <span
        aria-disabled="true"
        title={LOCKED}
        className={cx(
          itemClass,
          'cursor-not-allowed border-transparent font-medium text-[#8A949E]',
        )}
      >
        <Icon aria-hidden size={ICON_SIZE.medium} />
        <span>{label}</span>
        <Lock aria-hidden size={LOCK_ICON_SIZE} />
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-current={current ? 'page' : undefined}
      className={cx(
        itemClass,
        current
          ? 'border-[#1D4E89] font-semibold text-[#1D4E89]'
          : 'border-transparent font-medium text-[#2E3A46] hover:text-[#17212B]',
      )}
    >
      <Icon aria-hidden size={ICON_SIZE.medium} />
      <span>{label}</span>
    </Link>
  );
}

function NavGroup({ code, name, items }: AppNavGroup) {
  const active = items.some((item) => item.current);
  return (
    <div
      role="group"
      aria-label={`${code} ${name}`}
      title={`${code} · ${name}`}
      className="flex flex-none items-center gap-0.5 border-l border-[#E6EAEE] px-2"
    >
      <span
        className={cx(
          'rounded-[4px] px-1.5 py-0.5 font-mono text-[11px] font-medium',
          active ? 'bg-[#1D4E89] text-white' : 'bg-[#EEF1F4] text-[#46525F]',
        )}
      >
        {code}
      </span>
      {items.map((item) => (
        <NavItem key={item.label} {...item} />
      ))}
    </div>
  );
}

// AppHeader is the rescue.lk header from the design: the brand, the language and
// large text controls, the signed-in officer, and the main navigation grouped by
// use case.
// Presentational and static: language and large text are shown but disabled, and
// the officer comes from SIGNED_IN_USER until login exists.
// DRY + OCP: the navigation is the APP_NAV data list, so adding a screen never
// edits this component. Accessibility: the current screen is marked with
// aria-current and locked screens say why in their title.
export function AppHeader() {
  return (
    <header className="border-b border-[#D9DFE5] bg-white">
      <div className="mx-auto flex min-h-[60px] max-w-[1360px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6">
        <div className="flex items-center gap-2.5">
          <span className="grid size-[34px] place-items-center rounded-[7px] bg-[#1D4E89] text-white">
            <LifeBuoy aria-hidden size={BRAND_ICON_SIZE} />
          </span>
          <div>
            <div className="text-[16px] font-bold tracking-[-0.01em]">
              rescue.lk
            </div>
            <div className="text-[12px] text-[#4F5B67]">
              Disaster Management Centre · Sri Lanka
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 py-2.5">
          <label className="flex items-center gap-1.5 text-[13px] text-[#4F5B67]">
            <Languages aria-hidden size={ICON_SIZE.medium} />
            <span>Language</span>
            <select
              disabled
              title={NOT_YET}
              defaultValue="en"
              className={cx(control, 'px-2')}
            >
              {LANGUAGES.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled
            aria-pressed={false}
            title={NOT_YET}
            className={cx(control, 'flex items-center gap-1.5 px-2.5')}
          >
            <ALargeSmall aria-hidden size={ICON_SIZE.medium} />
            Large text
          </button>
          <div className="flex items-center gap-2 border-l border-[#D9DFE5] pl-2.5">
            <CircleUserRound
              aria-hidden
              size={USER_ICON_SIZE}
              className="text-[#4F5B67]"
            />
            <div className="leading-[1.25]">
              <div className="text-[13px] font-semibold">
                {SIGNED_IN_USER.name}
              </div>
              <div className="text-[12px] text-[#4F5B67]">
                {SIGNED_IN_USER.role}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#E6EAEE]">
        <div className="mx-auto max-w-[1360px] px-2">
          <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-4">
            {APP_NAV.map((group) => (
              <NavGroup key={group.code} {...group} />
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
