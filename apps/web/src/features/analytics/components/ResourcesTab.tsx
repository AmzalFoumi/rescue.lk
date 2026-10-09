'use client';

import { useState, useEffect } from 'react';
import { generateReport } from '@/lib/api';
import { useDemoRole } from '../context/DemoRoleContext';
import type { AnalyticsFiltersState } from './AnalyticsFilterBar';
import type { TabularReportData } from '@rescue-lk/shared/analytics/report.types';
import { Panel, StateMessage } from '../../response/components/ui';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ResourcesTabProps {
  filters: AnalyticsFiltersState;
}

export function ResourcesTab({ filters }: ResourcesTabProps) {
  const { role } = useDemoRole();
  const [report, setReport] = useState<TabularReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await generateReport(
          {
            type: 'RESOURCE_DISTRIBUTION',
            from: filters.from,
            to: filters.to,
            district:
              filters.district === 'All districts'
                ? undefined
                : filters.district,
            hazardType:
              filters.hazardType === 'All hazards'
                ? undefined
                : filters.hazardType,
          },
          role,
        );
        setReport(data);
      } catch {
        setReport(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [filters, role]);

  if (loading) {
    return <StateMessage kind="empty" message="Loading resources data..." />;
  }

  const rows = report?.rows || [];

  const totalItems = rows.reduce((sum, r) => sum + Number(r.quantity || 0), 0);

  const orgs = new Set(rows.map((r) => String(r['owner-organisation'])));
  const districts = new Set(rows.map((r) => String(r.district)));

  // Resources by district
  const districtMap: Record<string, number> = {};
  rows.forEach((r) => {
    const dist = String(r.district);
    districtMap[dist] = (districtMap[dist] || 0) + Number(r.quantity || 0);
  });
  const districtChartData = Object.entries(districtMap)
    .map(([district, quantity]) => ({ district, quantity }))
    .sort((a, b) => b.quantity - a.quantity);

  // Resource type breakdown
  const itemMap: Record<string, number> = {};
  rows.forEach((r) => {
    const item = String(r.item);
    itemMap[item] = (itemMap[item] || 0) + Number(r.quantity || 0);
  });
  const itemChartData = Object.entries(itemMap)
    .map(([item, quantity]) => ({ item, quantity }))
    .sort((a, b) => b.quantity - a.quantity);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-[10px] border border-line shadow-sm flex items-center gap-4">
          <div className="bg-green-50 p-3 rounded-[10px] text-green-600">
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <div>
            <div className="text-sm text-ink-muted">Items distributed</div>
            <div className="text-2xl font-bold text-ink">
              {totalItems.toLocaleString()}
            </div>
            <div className="text-xs text-ink-muted">
              {rows.length} distributions logged
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div>
            <div className="text-sm text-ink-muted">
              Organisations contributing
            </div>
            <div className="text-2xl font-bold text-ink">{orgs.size}</div>
            <div
              className="text-xs text-ink-muted truncate max-w-[200px]"
              title={Array.from(orgs).join(', ')}
            >
              {Array.from(orgs).slice(0, 2).join(', ')}
              {orgs.size > 2 ? '...' : ''}
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-[10px] border border-line shadow-sm flex items-center gap-4">
          <div className="bg-orange-50 p-3 rounded-[10px] text-orange-600">
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
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <div className="text-sm text-ink-muted">Districts supplied</div>
            <div className="text-2xl font-bold text-ink">{districts.size}</div>
            <div
              className="text-xs text-ink-muted truncate max-w-[200px]"
              title={Array.from(districts).join(', ')}
            >
              {Array.from(districts).slice(0, 3).join(', ')}
              {districts.size > 3 ? '...' : ''}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Resource distribution by district">
          <div className="h-64 px-4 pb-4 pt-2">
            {districtChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={districtChartData}
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
                    dataKey="quantity"
                    fill="#1E3A8A"
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <StateMessage kind="empty" message="No data available" />
            )}
          </div>
        </Panel>

        <Panel title="Resource type breakdown">
          <div className="h-64 px-4 pb-4 pt-2">
            {itemChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={itemChartData}
                  layout="vertical"
                  margin={{ left: 40 }}
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
                    dataKey="item"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickLine={false}
                    axisLine={false}
                    width={100}
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
                    dataKey="quantity"
                    fill="#1E3A8A"
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <StateMessage kind="empty" message="No data available" />
            )}
          </div>
        </Panel>
      </div>

      <Panel title="Resource distribution details">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-line bg-page text-ink-muted">
              <tr>
                {report?.columns.map((c) => (
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
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-page transition-colors">
                  {report?.columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-4 py-3 whitespace-nowrap ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'}`}
                    >
                      {row[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={report?.columns.length || 4}>
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
