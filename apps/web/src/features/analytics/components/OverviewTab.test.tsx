import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { OverviewTab } from './OverviewTab';
import { generateReport } from '@/lib/api';
import type { TabularReportData } from '@rescue-lk/shared/analytics/report.types';
import { useDemoRole } from '../context/DemoRoleContext';
import type { AnalyticsFiltersState } from './AnalyticsFilterBar';

vi.mock('@/lib/api', () => ({
  generateReport: vi.fn(),
}));

vi.mock('../context/DemoRoleContext', () => ({
  useDemoRole: vi.fn(),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: React.PropsWithChildren<unknown>) => (
    <div>{children}</div>
  ),
  BarChart: ({ children }: React.PropsWithChildren<unknown>) => (
    <div>{children}</div>
  ),
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Cell: () => <div />,
}));

describe('OverviewTab', () => {
  const mockFilters: AnalyticsFiltersState = {
    from: '2026-09-09',
    setFrom: vi.fn(),
    to: '2026-10-09',
    setTo: vi.fn(),
    district: 'All districts',
    setDistrict: vi.fn(),
    hazardType: 'All hazards',
    setHazardType: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(useDemoRole).mockReturnValue({
      role: 'DMC_ADMIN',
      setRole: vi.fn(),
    });
  });

  it('shows loading initially', () => {
    vi.mocked(generateReport).mockReturnValue(new Promise(() => {}));
    render(<OverviewTab filters={mockFilters} />);
    expect(screen.getByText('Loading overview data...')).toBeInTheDocument();
  });

  it('renders data and KPIs after loading', async () => {
    vi.mocked(generateReport).mockImplementation(async ({ type }) => {
      if (type === 'ALERT_TIMELINE') {
        return {
          type: 'ALERT_TIMELINE' as const,
          title: 'Alert Timeline',
          description: '',
          generatedAt: '',
          filters: { from: '', to: '' },
          columns: [],
          rows: [{ date: '2026-10-01' }, { date: '2026-10-02' }],
        };
      }
      if (type === 'CITIZENS_REACHED') {
        return {
          type: 'CITIZENS_REACHED' as const,
          title: 'Citizens Reached',
          description: '',
          generatedAt: '',
          filters: { from: '', to: '' },
          columns: [],
          rows: [
            { district: 'Colombo', reached: 50 },
            { district: 'Kegalle', reached: 25 },
          ],
        };
      }
      if (type === 'SHELTER_OCCUPANCY') {
        return {
          type: 'SHELTER_OCCUPANCY' as const,
          title: 'Shelter Occupancy',
          description: '',
          generatedAt: '',
          filters: { from: '', to: '' },
          columns: [],
          rows: [{ district: 'Colombo', occupancy: 100, occupied: 100 }],
        };
      }
      if (type === 'RESOURCE_DISTRIBUTION') {
        return {
          type: 'RESOURCE_DISTRIBUTION' as const,
          title: 'Resource Distribution',
          description: '',
          generatedAt: '',
          filters: { from: '', to: '' },
          columns: [],
          rows: [{ district: 'Colombo', quantity: 200 }],
        };
      }
      return null as unknown as TabularReportData;
    });

    render(<OverviewTab filters={mockFilters} />);

    await waitFor(() => {
      expect(
        screen.queryByText('Loading overview data...'),
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText('Warnings issued')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThan(0); // 2 rows in ALERT_TIMELINE

    expect(screen.getByText('Citizens reached')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument(); // 50 + 25

    expect(screen.getByText('Peak shelter occupancy')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument(); // max occupancy

    expect(screen.getByText('Items distributed')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('handles null data gracefully', async () => {
    vi.mocked(generateReport).mockRejectedValue(new Error('Network error'));

    render(<OverviewTab filters={mockFilters} />);

    await waitFor(() => {
      expect(
        screen.queryByText('Loading overview data...'),
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText('No alerts data available.')).toBeInTheDocument();
    expect(screen.getByText('No reach data available.')).toBeInTheDocument();
    expect(
      screen.getByText('No occupancy data available.'),
    ).toBeInTheDocument();
    expect(screen.getByText('No resource data available.')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(4); // 4 KPIs should be 0
  });
});
