import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AlertsReachTab } from './AlertsReachTab';
import { generateReport } from '@/lib/api';
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
}));

describe('AlertsReachTab', () => {
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
    render(<AlertsReachTab filters={mockFilters} />);
    expect(
      screen.getByText('Loading alerts and reach data...'),
    ).toBeInTheDocument();
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
          columns: [
            { key: 'district', label: 'District', align: 'left' as const },
            { key: 'severity', label: 'Severity', align: 'left' as const },
          ],
          rows: [
            { district: 'Colombo', severity: 'CRITICAL', date: '2026-10-01' },
            { district: 'Kegalle', severity: 'HIGH', date: '2026-10-02' },
          ],
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
            { district: 'Colombo', citizensReached: 50 },
            { district: 'Kegalle', citizensReached: 25 },
          ],
        };
      }
      return null as React.ReactNode;
    });

    render(<AlertsReachTab filters={mockFilters} />);

    await waitFor(() => {
      expect(
        screen.queryByText('Loading alerts and reach data...'),
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText('Warnings issued')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // 2 warnings
    expect(screen.getByText('2 Critical or High')).toBeInTheDocument(); // both CRITICAL/HIGH

    expect(screen.getByText('Citizens reached')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument(); // 50 + 25

    // Table rendering with Chips for severity
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('handles empty rows gracefully', async () => {
    vi.mocked(generateReport).mockResolvedValue({
      type: 'ALERT_TIMELINE' as const,
      title: 'Report',
      description: '',
      generatedAt: '',
      filters: { from: '', to: '' },
      columns: [],
      rows: [],
    });

    render(<AlertsReachTab filters={mockFilters} />);

    await waitFor(() => {
      expect(
        screen.queryByText('Loading alerts and reach data...'),
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText('Warnings issued')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(2); // alertsIssued, reach
    expect(screen.getByText('0 Critical or High')).toBeInTheDocument();
    expect(screen.getAllByText('No data')).toHaveLength(2); // tables
  });

  it('handles error gracefully', async () => {
    vi.mocked(generateReport).mockRejectedValue(new Error('Failed'));

    render(<AlertsReachTab filters={mockFilters} />);

    await waitFor(() => {
      expect(
        screen.queryByText('Loading alerts and reach data...'),
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText('No alerts data available.')).toBeInTheDocument();
    expect(screen.getByText('No reach data available.')).toBeInTheDocument();
  });
});
