'use client';

import { useState } from 'react';
import type { HazardReportDto } from '@rescue-lk/shared';
import { useHazardReportsApi } from '../api/api-context';
import { Button } from '../components/Button';
import { DecisionPanel } from '../components/DecisionPanel';
import { DuplicatesPanel } from '../components/DuplicatesPanel';
import { PendingList } from '../components/PendingList';
import { ReportDetails } from '../components/ReportDetails';
import { StateMessage } from '../components/StateMessage';
import { Toast } from '../components/Toast';
import { describeDecision } from '../domain/decision-message';
import { useAsyncAction } from '../hooks/use-async-action';
import {
  useDistricts,
  useDuplicateReports,
  usePendingReports,
} from '../hooks/use-report-data';
import { useReporting } from '../state/reporting-context';

/** What the operator decided. A rejection carries the reason text. */
type Decision = { kind: 'verified' } | { kind: 'rejected'; reason: string };

/** The DMC Operator's page: the pending list on one side, the report to decide on the other. */
export function OperatorVerifyScreen() {
  const api = useHazardReportsApi();
  const { operator } = useReporting();
  const pending = usePendingReports();
  const districts = useDistricts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // On a phone only one pane fits: the list, or the report that was picked.
  const [showDetail, setShowDetail] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [openedAt] = useState(() => new Date());

  const reports = pending.data ?? [];
  const selected: HazardReportDto | null =
    reports.find((report) => report.id === selectedId) ?? reports[0] ?? null;
  const duplicates = useDuplicateReports(selected?.possibleDuplicateOf ?? []);

  const decide = useAsyncAction(
    async (report: HazardReportDto, decision: Decision) => {
      if (decision.kind === 'verified') {
        await api.verify(report.id, operator.id);
      } else {
        await api.reject(report.id, operator.id, decision.reason);
      }
      setToast(
        describeDecision(decision.kind, report.id, operator.name, new Date()),
      );
      setShowDetail(false);
      pending.reload();
    },
  );

  if (pending.error) {
    return (
      <StateMessage
        kind="error"
        message={pending.error}
        onRetry={pending.reload}
      />
    );
  }
  if (pending.loading && reports.length === 0) {
    return <StateMessage kind="loading" />;
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Verify Reports</h1>
        <p className="text-ink-muted">
          Citizen reports waiting for a decision, oldest first.
        </p>
      </header>
      {selected === null ? (
        <StateMessage
          kind="empty"
          message="No reports are waiting for verification."
        />
      ) : (
        <div className="lg:grid lg:grid-cols-[340px_1fr] lg:items-start lg:gap-6">
          <div className={showDetail ? 'hidden lg:block' : 'block'}>
            <PendingList
              reports={reports}
              selectedId={selected.id}
              districts={districts.data ?? []}
              now={openedAt}
              onSelect={(id) => {
                setSelectedId(id);
                setShowDetail(true);
              }}
            />
          </div>
          <div
            className={`space-y-4 ${showDetail ? 'block' : 'hidden lg:block'}`}
          >
            <Button
              variant="outline"
              className="lg:hidden"
              onClick={() => setShowDetail(false)}
            >
              Back to the list
            </Button>
            <ReportDetails report={selected} districts={districts.data ?? []} />
            <DuplicatesPanel
              duplicateIds={selected.possibleDuplicateOf}
              duplicates={duplicates}
              canOpen={(id) => reports.some((report) => report.id === id)}
              onOpen={setSelectedId}
            />
            <DecisionPanel
              key={selected.id}
              pending={decide.pending}
              error={decide.error}
              onVerify={() => decide.run(selected, { kind: 'verified' })}
              onReject={(reason) =>
                decide.run(selected, { kind: 'rejected', reason })
              }
            />
          </div>
        </div>
      )}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
