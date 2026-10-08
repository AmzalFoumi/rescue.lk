import type { ReactNode } from 'react';
import {
  Copy,
  FileCheck,
  ImageOff,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import type { VerifiedHazardReportDto } from '@rescue-lk/shared';
import { shortId } from '../../format';
import { ICON_SIZE } from '../../ui';
import { NotConnected, SOURCES } from '../NotConnected';
import { Card } from '../shell/Card';

interface EvidencePanelProps {
  report: VerifiedHazardReportDto;
  // Other verified reports from the same district within a day.
  sameDay: readonly VerifiedHazardReportDto[];
}

const EVIDENCE_ICON_SIZE = 17;

export function EvidencePanel({ report, sameDay }: EvidencePanelProps) {
  const evidence: [LucideIcon, string, ReactNode][] = [
    [
      Copy,
      'Possible duplicates',
      <NotConnected key="dup" source={SOURCES.hazardReports} />,
    ],
    [
      FileCheck,
      `Other verified reports, ${report.districtName}, same day`,
      sameDay.map((other) => shortId('R', other.id)).join(', ') || 'None',
    ],
    [
      Truck,
      'Response team',
      <NotConnected key="team" source={SOURCES.response} />,
    ],
  ];

  return (
    <Card title="Evidence and supporting information" titleId="evidence-title">
      <div className="grid items-start gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5 rounded-[8px] border border-dashed border-[#C5CDD6] bg-[#F7F8FA] p-3 text-center text-[13px] text-[#4F5B67]">
          <ImageOff aria-hidden size={ICON_SIZE.large} />
          Citizen photo
          <NotConnected source={SOURCES.hazardReports} />
        </div>
        <ul className="flex flex-col gap-3">
          {evidence.map(([Icon, label, value]) => (
            <li key={label} className="flex items-start gap-2.5">
              <Icon
                aria-hidden
                size={EVIDENCE_ICON_SIZE}
                className="mt-0.5 shrink-0 text-[#1D4E89]"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-[12.5px] text-[#4F5B67]">{label}</span>
                <span className="text-[14px] font-semibold">{value}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
