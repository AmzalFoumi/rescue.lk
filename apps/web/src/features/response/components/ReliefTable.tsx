import type { DistrictDto, ReliefDistributionDto } from '@rescue-lk/shared';
import { districtName, formatDate, formatNumber } from '../domain/format';
import {
  ORGANISATION_KIND_LABELS,
  RELIEF_ITEM_LABELS,
} from '../domain/presentation';
import { StateMessage } from './ui';

const COLUMNS = '130px 120px 110px minmax(180px,1.4fr) minmax(120px,1fr)';

/** What has gone out: item, quantity, district and the organisation that gave it. */
export function ReliefTable({
  distributions,
  districts,
}: {
  distributions: ReliefDistributionDto[];
  districts: DistrictDto[];
}) {
  if (distributions.length === 0) {
    return (
      <StateMessage
        kind="empty"
        message="No relief supplies have been logged yet."
      />
    );
  }
  return (
    <div className="overflow-x-auto">
      <div
        role="table"
        aria-label="Relief distribution records"
        className="min-w-[760px]"
      >
        <div
          role="row"
          className="grid gap-3 px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink-muted"
          style={{ gridTemplateColumns: COLUMNS }}
        >
          <span role="columnheader">Date</span>
          <span role="columnheader">Item</span>
          <span role="columnheader">Quantity</span>
          <span role="columnheader">Owner organisation</span>
          <span role="columnheader">To district</span>
        </div>
        {distributions.map((record) => (
          <div
            key={record.id}
            role="row"
            className="grid items-center gap-3 border-t border-line px-4 py-3 text-sm"
            style={{ gridTemplateColumns: COLUMNS }}
          >
            <span role="cell" className="text-ink-muted">
              {formatDate(record.distributedAt)}
            </span>
            <span role="cell">{RELIEF_ITEM_LABELS[record.item]}</span>
            <span role="cell">{formatNumber(record.quantity)}</span>
            <span role="cell" className="flex flex-col">
              <span>{record.owner.name}</span>
              <span className="text-xs text-ink-muted">
                {ORGANISATION_KIND_LABELS[record.owner.kind]}
              </span>
            </span>
            <span role="cell">{districtName(record.district, districts)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
