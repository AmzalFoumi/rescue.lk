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

interface SheltersTabProps {
  filters: AnalyticsFiltersState;
}

export function SheltersTab({ filters }: SheltersTabProps) {
  const { role } = useDemoRole();
  const [report, setReport] = useState<TabularReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await generateReport(
          {
            type: 'SHELTER_OCCUPANCY',
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
    return <StateMessage kind="empty" message="Loading shelters data..." />;
  }

  const rows = report?.rows || [];

  const peakOccupancy = rows.reduce(
    (max, r) => Math.max(max, Number(r.occupied || 0)),
    0,
  );
  const totalCapacity = rows.reduce(
    (sum, r) => sum + Number(r.capacity || 0),
    0,
  );
  const currentlySheltered = rows.reduce(
    (sum, r) => sum + Number(r.occupied || 0),
    0,
  );
  const placesAvailable = rows.reduce(
    (sum, r) => sum + Number(r.available || 0),
    0,
  );
  const totalShelters = rows.reduce(
    (sum, r) => sum + Number(r.shelters || 0),
    0,
  );

  const chartData = rows
    .map((r) => ({
      district: String(r.district),
      occupancy: Number(r.occupied || 0),
    }))
    .sort((a, b) => b.occupancy - a.occupancy);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
          <div>
            <div className="text-sm text-ink-muted">Peak shelter occupancy</div>
            <div className="text-2xl font-bold text-ink">
              {peakOccupancy.toLocaleString()}
            </div>
            <div className="text-xs text-ink-muted">
              {totalCapacity > 0
                ? Math.round((peakOccupancy / totalCapacity) * 100)
                : 0}
              % of {totalCapacity} places
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
            <div className="text-sm text-ink-muted">Currently sheltered</div>
            <div className="text-2xl font-bold text-ink">
              {currentlySheltered.toLocaleString()}
            </div>
            <div className="text-xs text-ink-muted">
              {totalShelters} shelters
            </div>
          </div>
        </div>
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
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <div className="text-sm text-ink-muted">Places available now</div>
            <div className="text-2xl font-bold text-ink">
              {placesAvailable.toLocaleString()}
            </div>
            <div className="text-xs text-ink-muted">
              Across matching shelters
            </div>
          </div>
        </div>
      </div>

      <Panel title="Shelter occupancy by district">
        <div className="h-64 px-4 pb-4 pt-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
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
                  dataKey="occupancy"
                  fill="#1E3A8A"
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <StateMessage kind="empty" message="No data available" />
          )}
        </div>
      </Panel>

      <Panel title="Shelter status by district">
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
                  {report?.columns.map((c) => {
                    let displayContent: React.ReactNode = row[
                      c.key
                    ] as React.ReactNode;
                    if (c.key === 'status') {
                      const statusStr = String(row[c.key]);
                      const tone =
                        statusStr === 'Critical'
                          ? 'danger'
                          : statusStr === 'Near full'
                            ? 'caution'
                            : 'success';
                      const icon =
                        statusStr === 'Critical'
                          ? 'ban'
                          : statusStr === 'Near full'
                            ? 'triangle-alert'
                            : 'house';
                      displayContent = (
                        <Chip
                          presentation={{
                            tone: tone as 'danger' | 'caution' | 'success',
                            label: statusStr,
                            icon: icon as 'ban' | 'triangle-alert' | 'house',
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
              {rows.length === 0 && (
                <tr>
                  <td colSpan={report?.columns.length || 6}>
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
