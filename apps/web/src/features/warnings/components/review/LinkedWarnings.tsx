import type { WarningDto } from '@rescue-lk/shared';
import { areaSummary, shortId } from '../../format';
import { cx, ui } from '../../ui';
import { Card } from '../shell/Card';
import { SeverityBadge, WarningStatusChip } from '../StatusChip';

interface LinkedWarningsProps {
  warnings: readonly WarningDto[];
  areaNames: Record<string, string>;
  onOpen: (warning: WarningDto) => void;
}

// Every warning issued from this report, newest first.
export function LinkedWarnings({
  warnings,
  areaNames,
  onOpen,
}: LinkedWarningsProps) {
  return (
    <Card title="Warnings for this report" titleId="linked-warnings-title">
      {warnings.length === 0 ? (
        <p className="px-4 py-[18px] text-[14px] text-[#4F5B67]">
          No warning has been issued for this report.
        </p>
      ) : (
        <ul>
          {warnings.map((warning) => (
            <li
              key={warning.id}
              className="flex flex-wrap items-center gap-2.5 border-b border-[#E6EAEE] px-4 py-[11px] last:border-b-0"
            >
              <span className="font-mono text-[13px]" title={warning.id}>
                {shortId('W', warning.id)}
              </span>
              <SeverityBadge severity={warning.severity} />
              <WarningStatusChip status={warning.status} />
              <span className="flex-[1_1_140px] text-[13px] text-[#4F5B67]">
                {areaSummary(warning.areaIds, areaNames)}
              </span>
              <button
                type="button"
                onClick={() => onOpen(warning)}
                aria-label={`Open ${shortId('W', warning.id)}`}
                className={cx(
                  ui.buttonSecondary,
                  'h-8 px-2.5 py-0 text-[13px] text-[#1D4E89]',
                )}
              >
                Open
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
