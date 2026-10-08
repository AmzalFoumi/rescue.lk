import type { ReactNode } from 'react';
import type { VerifiedHazardReportDto } from '@rescue-lk/shared';
import { formatDateTime } from '../../format';
import { HAZARD_META } from '../../meta';
import { NotConnected, SOURCES } from '../NotConnected';
import { Card } from '../shell/Card';

// The verified report's key facts, as the reviewing officer reads them.
export function HazardOverview({
  report,
}: {
  report: VerifiedHazardReportDto;
}) {
  const rows: [string, ReactNode][] = [
    ['Hazard type', HAZARD_META[report.hazardType].label],
    ['Reported by', `${report.reporter}, citizen`],
    ['Location', `${report.place}, ${report.districtName} District`],
    ['Coordinates', <NotConnected key="gps" source={SOURCES.hazardReports} />],
    ['Submitted', formatDateTime(report.submittedAt)],
    [
      'Verified',
      `${formatDateTime(report.verifiedAt)} by ${report.verifiedBy}`,
    ],
    ['Description', report.description],
  ];

  return (
    <Card title="Hazard overview" titleId="hazard-overview-title">
      <dl className="grid grid-cols-[130px_minmax(0,1fr)]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="border-b border-[#EEF1F4] bg-[#FBFCFD] px-4 py-[9px] text-[13px] text-[#4F5B67]">
              {label}
            </dt>
            <dd className="border-b border-[#EEF1F4] px-4 py-[9px] text-[14px] leading-[1.45]">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
