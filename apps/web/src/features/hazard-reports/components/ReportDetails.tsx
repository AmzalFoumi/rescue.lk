import type { DistrictDto, HazardReportDto } from '@rescue-lk/shared';
import { formatCoordinates, formatDateTime } from '../domain/format';
import { hazardTitle } from '../domain/hazard-types';
import { photoFileName } from '../domain/photo-url';
import { describePlace } from '../domain/report-card';
import { shortReportId } from '../domain/report-id';
import { StatusChip } from './StatusChip';
import { CARD_CLASS } from './tone-classes';

interface ReportDetailsProps {
  report: HazardReportDto;
  districts: readonly DistrictDto[];
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${CARD_CLASS} space-y-2`}>
      <h3 className="font-semibold">{title}</h3>
      {children}
    </section>
  );
}

/** What the operator reads before deciding: the report, where it is, and the photo. */
export function ReportDetails({ report, districts }: ReportDetailsProps) {
  const fileName = photoFileName(report.photoUrl);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">
            Report review{' '}
            <span className="font-mono text-base text-ink-muted">
              {shortReportId(report.id)}
            </span>
          </h2>
          <p className="text-sm text-ink-muted">
            Submitted {formatDateTime(report.submittedAt)}
          </p>
        </div>
        <StatusChip status={report.status} />
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Report details">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-ink-muted">Report ID</dt>
            <dd>{shortReportId(report.id)}</dd>
            <dt className="text-ink-muted">Reporter</dt>
            <dd>{`${report.reporterName ?? report.reporterId}, ${report.reporterRole.replaceAll('_', ' ')}`}</dd>
            <dt className="text-ink-muted">Hazard type</dt>
            <dd>{hazardTitle(report.hazardType, report.otherHazard)}</dd>
            <dt className="text-ink-muted">Description</dt>
            <dd>{report.description}</dd>
          </dl>
        </Section>
        <div className="space-y-4">
          <Section title="Location (from report)">
            <p className="font-semibold">{describePlace(report, districts)}</p>
            <p className="font-mono text-sm text-ink-muted">
              {formatCoordinates(
                report.location.latitude,
                report.location.longitude,
              )}
            </p>
            <p className="text-sm text-ink-muted">
              {report.placeName
                ? 'Entered by the citizen'
                : 'Captured by phone GPS'}
            </p>
          </Section>
          <Section title="Evidence">
            <p className="rounded-lg border border-dashed border-line-input p-4 text-center text-ink-muted">
              {fileName ? `Citizen photo: ${fileName}` : 'No photo attached'}
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
