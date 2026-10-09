import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ResourcesTab } from './ResourcesTab';
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
}));

describe('ResourcesTab', () => {
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
    render(<ResourcesTab filters={mockFilters} />);
    expect(screen.getByText('Loading resources data...')).toBeInTheDocument();
  });

  it('renders data and KPIs after loading', async () => {
    vi.mocked(generateReport).mockResolvedValue({
      type: 'RESOURCE_DISTRIBUTION' as const,
      title: 'Resource Distribution',
      description: '',
      generatedAt: '',
      filters: { from: '', to: '' },
      columns: [
        { key: 'district', label: 'District', align: 'left' as const },
        { key: 'quantity', label: 'Quantity', align: 'right' as const },
      ],
      rows: [
        {
          district: 'Colombo',
          item: 'Water',
          quantity: 200,
          'owner-organisation': 'Red Cross',
        },
        {
          district: 'Kegalle',
          item: 'Food',
          quantity: 150,
          'owner-organisation': 'Red Cross',
        },
        {
          district: 'Kegalle',
          item: 'Water',
          quantity: 50,
          'owner-organisation': 'UNICEF',
        },
      ],
    });

    render(<ResourcesTab filters={mockFilters} />);

    await waitFor(() => {
      expect(
        screen.queryByText('Loading resources data...'),
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText('Items distributed')).toBeInTheDocument();
    expect(screen.getByText('400')).toBeInTheDocument(); // 200 + 150 + 50

    expect(screen.getByText('Organisations contributing')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThan(0); // Red Cross, UNICEF

    expect(screen.getByText('Districts supplied')).toBeInTheDocument();
    // 2 districts (Colombo, Kegalle)
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    expect(screen.getByText('Colombo, Kegalle')).toBeInTheDocument();
  });

  it('handles empty rows gracefully', async () => {
    vi.mocked(generateReport).mockResolvedValue({
      type: 'RESOURCE_DISTRIBUTION' as const,
      title: 'Resource Distribution',
      description: '',
      generatedAt: '',
      filters: { from: '', to: '' },
      columns: [],
      rows: [],
    });

    render(<ResourcesTab filters={mockFilters} />);

    await waitFor(() => {
      expect(
        screen.queryByText('Loading resources data...'),
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText('Items distributed')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(3); // totalItems, orgs.size, districts.size
    expect(screen.getAllByText('No data available')).toHaveLength(2); // charts
    expect(screen.getByText('No data')).toBeInTheDocument(); // table
  });

  it('handles error gracefully', async () => {
    vi.mocked(generateReport).mockRejectedValue(new Error('Failed'));

    render(<ResourcesTab filters={mockFilters} />);

    await waitFor(() => {
      expect(
        screen.queryByText('Loading resources data...'),
      ).not.toBeInTheDocument();
    });

    expect(screen.getAllByText('No data available')).toHaveLength(2);
  });
});
