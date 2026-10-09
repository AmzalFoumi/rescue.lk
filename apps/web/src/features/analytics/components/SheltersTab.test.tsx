import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SheltersTab } from './SheltersTab';
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

describe('SheltersTab', () => {
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
    render(<SheltersTab filters={mockFilters} />);
    expect(screen.getByText('Loading shelters data...')).toBeInTheDocument();
  });

  it('renders data and KPIs after loading', async () => {
    vi.mocked(generateReport).mockResolvedValue({
      type: 'SHELTER_OCCUPANCY' as const,
      title: 'Shelter Occupancy',
      description: '',
      generatedAt: '',
      filters: { from: '', to: '' },
      columns: [
        { key: 'district', label: 'District', align: 'left' as const },
        { key: 'status', label: 'Status', align: 'center' as const },
        { key: 'occupied', label: 'Occupied', align: 'right' as const },
        { key: 'capacity', label: 'Capacity', align: 'right' as const },
        { key: 'available', label: 'Available', align: 'right' as const },
        { key: 'shelters', label: 'Shelters', align: 'right' as const },
      ],
      rows: [
        {
          district: 'Colombo',
          status: 'Critical',
          occupied: 100,
          capacity: 100,
          available: 0,
          shelters: 1,
        },
        {
          district: 'Kegalle',
          status: 'Near full',
          occupied: 80,
          capacity: 100,
          available: 20,
          shelters: 1,
        },
        {
          district: 'Ratnapura',
          status: 'Available',
          occupied: 20,
          capacity: 100,
          available: 80,
          shelters: 2,
        },
      ],
    });

    render(<SheltersTab filters={mockFilters} />);

    await waitFor(() => {
      expect(
        screen.queryByText('Loading shelters data...'),
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText('Peak shelter occupancy')).toBeInTheDocument();
    expect(screen.getAllByText('100').length).toBeGreaterThan(0); // max peak

    expect(screen.getByText('Currently sheltered')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument(); // 100 + 80 + 20

    expect(screen.getAllByText('100').length).toBeGreaterThan(0); // 0 + 20 + 80

    // Table rendering with Chips
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('Near full')).toBeInTheDocument();
    expect(screen.getAllByText('Available').length).toBeGreaterThan(0);
  });

  it('handles empty rows gracefully', async () => {
    vi.mocked(generateReport).mockResolvedValue({
      type: 'SHELTER_OCCUPANCY' as const,
      title: 'Shelter Occupancy',
      description: '',
      generatedAt: '',
      filters: { from: '', to: '' },
      columns: [],
      rows: [],
    });

    render(<SheltersTab filters={mockFilters} />);

    await waitFor(() => {
      expect(
        screen.queryByText('Loading shelters data...'),
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText('Peak shelter occupancy')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(3); // zeroes in KPIs
    expect(screen.getByText('No data available')).toBeInTheDocument(); // chart
    expect(screen.getByText('No data')).toBeInTheDocument(); // table
  });

  it('handles error gracefully', async () => {
    vi.mocked(generateReport).mockRejectedValue(new Error('Failed'));

    render(<SheltersTab filters={mockFilters} />);

    await waitFor(() => {
      expect(
        screen.queryByText('Loading shelters data...'),
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });
});
