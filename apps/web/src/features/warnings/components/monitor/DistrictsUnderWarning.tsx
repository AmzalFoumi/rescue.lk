import { shortId } from '../../format';
import type { DistrictUnderWarning } from '../../monitoring';
import { Card } from '../shell/Card';
import { SeverityBadge } from '../StatusChip';

// DistrictsUnderWarning lists each district covered by an active warning, most severe
// first.
// Presentational: the list is worked out in monitoring.ts (pure and tested).
export function DistrictsUnderWarning({
  entries,
}: {
  entries: readonly DistrictUnderWarning[];
}) {
  return (
    <Card
      title="Districts under warning"
      titleId="districts-under-warning-title"
    >
      {entries.length === 0 ? (
        <p className="px-4 py-5 text-[14px] text-[#4F5B67]">
          No district has an active warning.
        </p>
      ) : (
        <ul>
          {entries.map(({ district, severity, warningIds }) => (
            <li
              key={district}
              className="flex items-center justify-between gap-2.5 border-b border-[#E6EAEE] px-4 py-2.5 last:border-b-0"
            >
              <span className="flex flex-col gap-0.5">
                <span className="text-[14px] font-semibold">{district}</span>
                <span className="font-mono text-[12.5px] text-[#4F5B67]">
                  {warningIds.map((id) => shortId('W', id)).join(', ')}
                </span>
              </span>
              <SeverityBadge severity={severity} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
