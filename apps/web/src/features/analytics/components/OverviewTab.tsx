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

interface OverviewTabProps {
  filters: AnalyticsFiltersState;
}

export function OverviewTab({ filters }: OverviewTabProps) {
  const { role } = useDemoRole();
  const [data, setData] = useState<{
    alerts: TabularReportData | null;
    reach: TabularReportData | null;
    shelters: TabularReportData | null;
    resources: TabularReportData | null;
  }>({ alerts: null, reach: null, shelters: null, resources: null });
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

        const [alerts, reach, shelters, resources] = await Promise.all([
          generateReport({ type: 'ALERT_TIMELINE', ...reqOpts }, role).catch(
            () => null,
          ),
          generateReport({ type: 'CITIZENS_REACHED', ...reqOpts }, role).catch(
            () => null,
          ),
          generateReport({ type: 'SHELTER_OCCUPANCY', ...reqOpts }, role).catch(
            () => null,
          ),
          generateReport(
            { type: 'RESOURCE_DISTRIBUTION', ...reqOpts },
            role,
          ).catch(() => null),
        ]);

        setData({ alerts, reach, shelters, resources });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [filters, role]);

  if (loading) {
    return <StateMessage kind="empty" message="Loading overview data..." />;
  }

  // Calculate KPIs
  const alertsIssued = data.alerts?.rows.length || 0;

  const totalReach =
    data.reach?.rows.reduce((sum, row) => sum + Number(row.reached || 0), 0) ||
    0;

  const peakOccupancy =
    data.shelters?.rows.reduce(
      (max, row) => Math.max(max, Number(row.occupancy || 0)),
      0,
    ) || 0;

  const totalItems =
    data.resources?.rows.reduce(
      (sum, row) => sum + Number(row.quantity || 0),
      0,
    ) || 0;

  // Alerts per day chart data
  const alertsPerDayMap: Record<string, number> = {};
  data.alerts?.rows.forEach((r) => {
    const d = String(r.date).split('T')[0];
    alertsPerDayMap[d] = (alertsPerDayMap[d] || 0) + 1;
  });
  const alertsChartData = Object.entries(alertsPerDayMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Citizens reached by district (horizontal bar)
  const reachByDistrictMap: Record<string, number> = {};
  data.reach?.rows.forEach((r) => {
    const dist = String(r.district);
    reachByDistrictMap[dist] =
      (reachByDistrictMap[dist] || 0) + Number(r.reached || 0);
  });
  const reachChartData = Object.entries(reachByDistrictMap)
    .map(([district, reach]) => ({ district, reach }))
    .sort((a, b) => b.reach - a.reach);

  // Occupancy by district
  const occupancyChartData = (data.shelters?.rows || [])
    .map((r) => ({
      district: String(r.district),
      occupancy: Number(r.occupied || 0),
    }))
    .sort((a, b) => b.occupancy - a.occupancy);

  // Resources by district
  const resourcesByDistrictMap: Record<string, number> = {};
  data.resources?.rows.forEach((r) => {
    const dist = String(r.district);
    resourcesByDistrictMap[dist] =
      (resourcesByDistrictMap[dist] || 0) + Number(r.quantity || 0);
  });
  const resourcesChartData = Object.entries(resourcesByDistrictMap)
    .map(([district, quantity]) => ({ district, quantity }))
    .sort((a, b) => b.quantity - a.quantity);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-[10px] border border-line shadow-sm">
          <div className="text-sm text-ink-muted">Warnings issued</div>
          <div className="text-2xl font-bold text-ink mt-1">{alertsIssued}</div>
        </div>
        <div className="bg-white p-4 rounded-[10px] border border-line shadow-sm">
          <div className="text-sm text-ink-muted">Citizens reached</div>
          <div className="text-2xl font-bold text-ink mt-1">
            {totalReach.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-4 rounded-[10px] border border-line shadow-sm">
          <div className="text-sm text-ink-muted">Peak shelter occupancy</div>
          <div className="text-2xl font-bold text-ink mt-1">
            {peakOccupancy.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-4 rounded-[10px] border border-line shadow-sm">
          <div className="text-sm text-ink-muted">Items distributed</div>
          <div className="text-2xl font-bold text-ink mt-1">
            {totalItems.toLocaleString()}
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

        <Panel title="Shelter occupancy by district">
          <div className="h-64 px-4 pb-4 pt-2">
            {occupancyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={occupancyChartData}
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
                    barSize={16}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <StateMessage
                kind="empty"
                message="No occupancy data available."
              />
            )}
          </div>
        </Panel>

        <Panel title="Resource distribution by district">
          <div className="h-64 px-4 pb-4 pt-2">
            {resourcesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={resourcesChartData}
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
              <StateMessage
                kind="empty"
                message="No resource data available."
              />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
