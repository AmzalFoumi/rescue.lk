import { ChevronRight, CircleDashed } from 'lucide-react';
import { formatDateTime, shortId } from '../../format';
import type { ReportRow } from '../../monitoring';
import { HAZARD_META, TONE_CLASSES, WARNING_STATUS_META } from '../../meta';
import { cx, ICON_SIZE, ui } from '../../ui';
import { Card } from '../shell/Card';
import { SeverityBadge, StatusChip } from '../StatusChip';

interface HazardEventsTableProps {
  rows: readonly ReportRow[];
  total: number;
  onReview: (reportId: string) => void;
}

const HEADERS = [
  'Report',
  'Hazard',
  'Location',
  'Verified',
  'Severity',
  'Warning',
];
const cell = 'px-4 py-3 align-middle text-[13.5px] text-[#2E3A46]';

// HazardEventsTable lists the verified reports and the warning each currently has.
// Presentational: filtering happens in monitoring.ts; the table only renders rows and
// reports which report or warning to open.
export function HazardEventsTable({
  rows,
  total,
  onReview,
}: HazardEventsTableProps) {
  return (
    <Card
      title="Hazard events (verified reports)"
      titleId="hazard-events-title"
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#E1E6EB]">
              {HEADERS.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-4 py-2 text-left text-[12px] font-bold text-[#4F5B67]"
                >
                  {header}
                </th>
              ))}
              <th scope="col">
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ report, warning }) => {
              const hazard = HAZARD_META[report.hazardType];
              return (
                <tr key={report.id} className="border-b border-[#EEF1F4]">
                  <td
                    className={cx(cell, 'font-mono text-[12.5px]')}
                    title={report.id}
                  >
                    {shortId('R', report.id)}
                  </td>
                  <td className={cell}>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#17212B]">
                      <hazard.icon aria-hidden size={ICON_SIZE.medium} />
                      {hazard.label}
                    </span>
                  </td>
                  <td className={cell}>
                    {report.place}, {report.districtName}
                  </td>
                  <td className={cell}>{formatDateTime(report.verifiedAt)}</td>
                  <td className={cell}>
                    {warning ? (
                      <SeverityBadge severity={warning.severity} />
                    ) : (
                      <span className={ui.hint}>Not assessed</span>
                    )}
                  </td>
                  <td className={cell}>
                    {warning ? (
                      <StatusChip
                        {...WARNING_STATUS_META[warning.status]}
                        label={`${shortId('W', warning.id)} ${WARNING_STATUS_META[warning.status].label}`}
                      />
                    ) : (
                      <span
                        className={cx(
                          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] font-semibold',
                          TONE_CLASSES.gray,
                        )}
                      >
                        <CircleDashed aria-hidden size={ICON_SIZE.small} />
                        No warning yet
                      </span>
                    )}
                  </td>
                  <td className={cx(cell, 'text-right')}>
                    <button
                      type="button"
                      onClick={() => onReview(report.id)}
                      aria-label={`Review ${shortId('R', report.id)}`}
                      className={cx(
                        ui.buttonSecondary,
                        'h-8 px-2.5 py-0 text-[13px] text-[#1D4E89]',
                      )}
                    >
                      Review
                      <ChevronRight aria-hidden size={ICON_SIZE.small} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="px-4 py-5 text-[14px] text-[#4F5B67]">
            No hazard events match these filters.
          </p>
        )}
      </div>
      <p className="border-t border-[#E6EAEE] px-4 py-2.5 text-[12.5px] text-[#4F5B67]">
        Showing {rows.length} of {total} verified reports
      </p>
    </Card>
  );
}
