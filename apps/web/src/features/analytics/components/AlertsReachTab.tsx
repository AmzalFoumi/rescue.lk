'use client';

import { useState, useEffect } from 'react';
import { generateReport } from '@/lib/api';
import { useDemoRole } from '../context/DemoRoleContext';
import type { AnalyticsFiltersState } from './AnalyticsFilterBar';
import type { TabularReportData } from '@rescue-lk/shared/analytics/report.types';
import { Panel, StateMessage, Chip } from '../../response/components/ui';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface AlertsReachTabProps {
  filters: AnalyticsFiltersState;
}

export function AlertsReachTab({ filters }: AlertsReachTabProps) {
  const { role } = useDemoRole();
  const [alertsReport, setAlertsReport] = useState<TabularReportData | null>(
    null,
  );
  const [reachReport, setReachReport] = useState<TabularReportData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const reqOpts = {
          from: filters.from,
          to: filters.to,
          district:
            filters.district === 'All districts' ? undefined : filters.district,
          hazardType:
            filters.hazardType === 'All hazards'
              ? undefined
              : filters.hazardType,
        };

        const [alerts, reach] = await Promise.all([
          generateReport({ type: 'ALERT_TIMELINE', ...reqOpts }, role).catch(
            () => null,
          ),
          generateReport({ type: 'CITIZENS_REACHED', ...reqOpts }, role).catch(
            () => null,
          ),
        ]);

        setAlertsReport(alerts);
        setReachReport(reach);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [filters, role]);

  if (loading) {
    return (
      <StateMessage kind="empty" message="Loading alerts and reach data..." />
    );
  }

  const alertsIssued = alertsReport?.rows.length || 0;
  const criticalOrHigh =
    alertsReport?.rows.filter(
      (r) => r.severity === 'CRITICAL' || r.severity === 'HIGH',
    ).length || 0;

  const totalReach =
    reachReport?.rows.reduce(
      (sum, row) => sum + Number(row.citizensReached || 0),
      0,
    ) || 0;

  // Alerts per day chart
  const alertsPerDayMap: Record<string, number> = {};
  alertsReport?.rows.forEach((r) => {
    const d = String(r.date).split('T')[0];
    alertsPerDayMap[d] = (alertsPerDayMap[d] || 0) + 1;
  });
  const alertsChartData = Object.entries(alertsPerDayMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Reach by district
  const reachByDistrictMap: Record<
    string,
    { reach: number; warnings: number }
  > = {};
  reachReport?.rows.forEach((r) => {
    const dist = String(r.district);
    if (!reachByDistrictMap[dist])
      reachByDistrictMap[dist] = { reach: 0, warnings: 0 };
    reachByDistrictMap[dist].reach += Number(r.citizensReached || 0);
  });
  alertsReport?.rows.forEach((r) => {
    const dist = String(r.district);
    if (reachByDistrictMap[dist]) reachByDistrictMap[dist].warnings += 1;
    else reachByDistrictMap[dist] = { reach: 0, warnings: 1 };
  });

  const reachChartData = Object.entries(reachByDistrictMap)
    .map(([district, data]) => ({ district, ...data }))
    .sort((a, b) => b.reach - a.reach);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-[10px] border border-line shadow-sm flex items-center gap-4">
          <div className="bg-red-50 p-3 rounded-[10px] text-red-600">
            <svg
              className="size-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              />
            </svg>
          </div>
          <div>
            <div className="text-sm text-ink-muted">Warnings issued</div>
            <div className="text-2xl font-bold text-ink">{alertsIssued}</div>
            <div className="text-xs text-ink-muted">
              {criticalOrHigh} Critical or High
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-[10px] border border-line shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-[10px] text-blue-600">
            <svg
              className="size-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <div>
            <div className="text-sm text-ink-muted">Citizens reached</div>
            <div className="text-2xl font-bold text-ink">
              {totalReach.toLocaleString()}
            </div>
            <div className="text-xs text-ink-muted">
              {reachChartData.length} districts notified
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Alerts issued">
          <div className="h-64 px-4 pb-4 pt-2">
            {alertsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={alertsChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E5E7EB"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#F3F4F6' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar dataKey="count" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <StateMessage kind="empty" message="No alerts data available." />
            )}
          </div>
        </Panel>

        <Panel title="Citizens reached by district">
          <div className="h-64 px-4 pb-4 pt-2">
            {reachChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reachChartData}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#E5E7EB"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="district"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#F3F4F6' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar
                    dataKey="reach"
                    fill="#1E3A8A"
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <StateMessage kind="empty" message="No reach data available." />
            )}
          </div>
        </Panel>
      </div>

      <Panel title="Citizens reached by district">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-line bg-page text-ink-muted">
              <tr>
                <th className="px-4 py-2 font-semibold">DISTRICT</th>
                <th className="px-4 py-2 font-semibold text-center">
                  WARNINGS
                </th>
                <th className="px-4 py-2 font-semibold text-right">
                  CITIZENS REACHED
                </th>
                <th className="px-4 py-2 font-semibold text-right">
                  SHARE OF TOTAL
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink">
              {reachChartData.map((row, i) => (
                <tr key={i} className="hover:bg-page transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {row.district}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    {row.warnings}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {row.reach.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {totalReach > 0
                      ? ((row.reach / totalReach) * 100).toFixed(1)
                      : '0'}
                    %
                  </td>
                </tr>
              ))}
              {reachChartData.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <StateMessage kind="empty" message="No data" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Timeline of alerts issued">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-line bg-page text-ink-muted">
              <tr>
                {alertsReport?.columns.map((c) => (
                  <th
                    key={c.key}
                    className={`px-4 py-2 font-semibold ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'}`}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink">
              {alertsReport?.rows.map((row, i) => (
                <tr key={i} className="hover:bg-page transition-colors">
                  {alertsReport?.columns.map((c) => {
                    let displayContent: React.ReactNode = row[
                      c.key
                    ] as React.ReactNode;
                    if (c.key === 'severity') {
                      const severityStr = String(row[c.key]);
                      const tone =
                        severityStr === 'CRITICAL' || severityStr === 'HIGH'
                          ? 'danger'
                          : severityStr === 'MEDIUM'
                            ? 'caution'
                            : 'info';
                      const icon =
                        severityStr === 'CRITICAL' || severityStr === 'HIGH'
                          ? 'ban'
                          : severityStr === 'MEDIUM'
                            ? 'triangle-alert'
                            : 'circle-help';
                      displayContent = (
                        <Chip
                          presentation={{
                            tone: tone as 'danger' | 'caution' | 'info',
                            label: severityStr,
                            icon: icon as
                              'ban' | 'triangle-alert' | 'circle-help',
                          }}
                        />
                      );
                    }
                    return (
                      <td
                        key={c.key}
                        className={`px-4 py-3 whitespace-nowrap ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'}`}
                      >
                        {displayContent}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {!alertsReport?.rows.length && (
                <tr>
                  <td colSpan={alertsReport?.columns.length || 6}>
                    <StateMessage kind="empty" message="No data" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
