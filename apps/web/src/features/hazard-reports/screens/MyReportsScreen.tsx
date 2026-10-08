'use client';

import { ReportCard } from '../components/ReportCard';
import { StateMessage } from '../components/StateMessage';
import { queuedToReportCard, toReportCard } from '../domain/report-card';
import { useDistricts, useMyReports } from '../hooks/use-report-data';
import { useReporting } from '../state/reporting-context';
import { CitizenFrame } from './CitizenFrame';

/** My Reports: the reports still on the phone first, then the reports the server knows, newest first. */
export function MyReportsScreen() {
  const { queue } = useReporting();
  const reports = useMyReports();
  const districts = useDistricts();
  const districtList = districts.data ?? [];

  const cards = [
    ...queue.queued.map((queued) => queuedToReportCard(queued, districtList)),
    ...(reports.data ?? []).map((report) => toReportCard(report, districtList)),
  ];

  let content;
  if (reports.error) {
    content = (
      <StateMessage
        kind="error"
        message={reports.error}
        onRetry={reports.reload}
      />
    );
  } else if (reports.loading && cards.length === 0) {
    content = <StateMessage kind="loading" />;
  } else if (cards.length === 0) {
    content = (
      <StateMessage kind="empty" message="You have not sent any reports yet." />
    );
  } else {
    content = (
      <ul className="space-y-3">
        {cards.map((card) => (
          <li key={card.key}>
            <ReportCard card={card} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <CitizenFrame>
      <h1 className="text-2xl font-bold">My Reports</h1>
      {content}
    </CitizenFrame>
  );
}
