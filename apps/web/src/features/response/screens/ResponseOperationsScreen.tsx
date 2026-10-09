'use client';

import { useState } from 'react';
import type { ResponseTargetDto } from '@rescue-lk/shared';
import { KpiCards } from '../components/KpiCards';
import { ResponseTabs, type ResponseTab } from '../components/ResponseTabs';
import { Notice, StateMessage } from '../components/ui';
import { DEMO_OFFICER } from '../domain/identities';
import { responseKpis } from '../domain/summaries';
import {
  useDistricts,
  useRelief,
  useResponseTargets,
  useShelters,
  useTeams,
} from '../hooks/use-response-data';
import { DispatchTab } from './DispatchTab';
import { OverviewTab } from './OverviewTab';
import { ReliefTab } from './ReliefTab';
import { SheltersTab } from './SheltersTab';

/**
 * The Response / Operations Officer's page. The four tabs are the four things
 * the case study asks of response coordination: see what needs a response,
 * dispatch teams, keep shelters right, log relief.
 */
export function ResponseOperationsScreen() {
  const [tab, setTab] = useState<ResponseTab>('overview');
  // Bumped after every change, which reloads all four lists together so no
  // total on screen is left out of date.
  const [version, setVersion] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  // Only the id is kept: the report itself is read from the latest list, so
  // its team count is never stale after a dispatch.
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const reports = useResponseTargets(version);
  const teams = useTeams(version);
  const shelters = useShelters(version);
  const relief = useRelief(version);
  const districts = useDistricts();

  // The chosen incident is kept, so the officer can send more support to it
  // without starting again (extension 8.a).
  function reloadAfter(text: string) {
    setMessage(text);
    setVersion((current) => current + 1);
  }

  const error =
    reports.error ?? teams.error ?? shelters.error ?? relief.error ?? null;
  const loading =
    reports.loading || teams.loading || shelters.loading || relief.loading;

  function reloadAll() {
    setVersion((current) => current + 1);
  }

  const reportList = reports.data ?? [];
  const teamList = teams.data?.teams ?? [];
  const shelterList = shelters.data ?? [];
  const reliefList = relief.data ?? [];
  const districtList = districts.data ?? [];

  const selectedReport =
    reportList.find((report) => report.id === selectedReportId) ?? null;

  function openDispatchFor(report: ResponseTargetDto) {
    setSelectedReportId(report.id);
    setTab('dispatch');
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Response Operations</h1>
          <p className="max-w-[760px] text-ink-muted">
            Monitor incidents, dispatch teams from every organisation, manage
            shelters and log relief distribution.
          </p>
        </div>
        <span className="rounded-[8px] border border-line bg-white px-3 py-2 text-[13px]">
          {DEMO_OFFICER.name} · Response / Operations Officer
        </span>
      </header>

      {message && (
        <Notice tone="success" onDismiss={() => setMessage(null)}>
          {message}
        </Notice>
      )}

      {error ? (
        <StateMessage kind="error" message={error} onRetry={reloadAll} />
      ) : loading ? (
        <StateMessage kind="loading" />
      ) : (
        <>
          <KpiCards kpis={responseKpis(reportList, teamList, shelterList)} />
          <ResponseTabs active={tab} onChange={setTab} />

          {tab === 'overview' && (
            <OverviewTab
              reports={reportList}
              teams={teamList}
              shelters={shelterList}
              relief={reliefList}
              districts={districtList}
              onDispatch={openDispatchFor}
            />
          )}
          {tab === 'dispatch' && (
            <DispatchTab
              reports={reportList}
              teams={teamList}
              districts={districtList}
              selectedReport={selectedReport}
              onSelectReport={(report) =>
                setSelectedReportId(report?.id ?? null)
              }
              onDispatched={reloadAfter}
            />
          )}
          {tab === 'shelters' && (
            <SheltersTab
              shelters={shelterList}
              districts={districtList}
              onChanged={reloadAfter}
            />
          )}
          {tab === 'relief' && (
            <ReliefTab
              distributions={reliefList}
              teams={teamList}
              shelters={shelterList}
              districts={districtList}
              onLogged={reloadAfter}
            />
          )}
        </>
      )}
    </div>
  );
}
