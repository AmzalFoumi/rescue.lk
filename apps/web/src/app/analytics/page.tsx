'use client';

import { useState } from 'react';
import { AnalyticsFilterBar } from '@/features/analytics/components/AnalyticsFilterBar';
import { AnalyticsTabs } from '@/features/analytics/components/AnalyticsTabs';
import { ReportGeneratorPanel } from '@/features/analytics/components/ReportGeneratorPanel';
import { OverviewTab } from '@/features/analytics/components/OverviewTab';
import { AlertsReachTab } from '@/features/analytics/components/AlertsReachTab';
import { SheltersTab } from '@/features/analytics/components/SheltersTab';
import { ResourcesTab } from '@/features/analytics/components/ResourcesTab';
import { useAnalyticsFilters } from '@/features/analytics/hooks/useAnalyticsFilters';
import {
  DemoRoleProvider,
  useDemoRole,
} from '@/features/analytics/context/DemoRoleContext';
import type { AnalyticsTab } from '@/features/analytics/config/role-view.config';

function RoleSwitcher() {
  const { role, setRole } = useDemoRole();

  return (
    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
      <span className="text-sm font-medium text-gray-500">View as:</span>
      <select
        value={role}
        onChange={(e) =>
          setRole(e.target.value as 'DMC_ADMIN' | 'DONOR_ORGANISATION')
        }
        className="text-sm font-bold text-blue-700 bg-blue-50 border-none rounded-lg py-1.5 px-3 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="DMC_ADMIN">DMC Admin</option>
        <option value="DONOR_ORGANISATION">Donor Organisation</option>
      </select>
    </div>
  );
}

function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const filters = useAnalyticsFilters();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Analytics & Reports
            </h1>
            <p className="mt-2 text-gray-500">
              Generate on-demand insights and statistical data
            </p>
          </div>
          <RoleSwitcher />
        </div>

        <AnalyticsFilterBar filters={filters} />

        <AnalyticsTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="mt-6">
          {activeTab === 'overview' && <OverviewTab filters={filters} />}
          {activeTab === 'alertsReach' && <AlertsReachTab filters={filters} />}
          {activeTab === 'shelters' && <SheltersTab filters={filters} />}
          {activeTab === 'resources' && <ResourcesTab filters={filters} />}
          {activeTab === 'reportGenerator' && (
            <ReportGeneratorPanel filters={filters} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <DemoRoleProvider>
      <AnalyticsDashboard />
    </DemoRoleProvider>
  );
}
