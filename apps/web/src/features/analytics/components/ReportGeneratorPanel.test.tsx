import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportGeneratorPanel } from './ReportGeneratorPanel';
import { useVisibleReportTypes } from '../hooks/useVisibleReportTypes';
import { useReportGenerator } from '../hooks/useReportGenerator';
import type { AnalyticsFiltersState } from './AnalyticsFilterBar';

vi.mock('../hooks/useVisibleReportTypes', () => ({
  useVisibleReportTypes: vi.fn(),
}));

vi.mock('../hooks/useReportGenerator', () => ({
  useReportGenerator: vi.fn(),
}));

vi.mock('./ReportTypeCard', () => ({
  ReportTypeCard: ({
    type,
    onSelect,
  }: {
    type: string;
    onSelect: () => void;
  }) => (
    <div data-testid={`card-${type}`} onClick={onSelect}>
      {type}
    </div>
  ),
}));

vi.mock('./ReportPreviewTable', () => ({
  ReportPreviewTable: () => <div data-testid="preview-table" />,
}));

vi.mock('./ExportButtons', () => ({
  ExportButtons: ({ onExport }: { onExport: (format: string) => void }) => (
    <div>
      <button onClick={() => onExport('CSV')}>Export CSV</button>
      <button onClick={() => onExport('PDF')}>Export PDF</button>
    </div>
  ),
}));

describe('ReportGeneratorPanel', () => {
  const mockFilters: AnalyticsFiltersState = {
    from: '2026-09-09',
    setFrom: vi.fn(),
    to: '2026-10-09',
    setTo: vi.fn(),
    district: 'All districts',
    setDistrict: vi.fn(),
    hazardType: 'Flood',
    setHazardType: vi.fn(),
  };

  const mockGenerate = vi.fn();
  const mockExportAs = vi.fn();

  beforeEach(() => {
    vi.mocked(useVisibleReportTypes).mockReturnValue([
      'CITIZENS_REACHED',
      'ALERT_TIMELINE',
    ]);
    vi.mocked(useReportGenerator).mockReturnValue({
      report: null,
      isLoading: false,
      error: null,
      generate: mockGenerate,
      exportAs: mockExportAs,
    });
  });

  it('renders one card per visible type', () => {
    render(<ReportGeneratorPanel filters={mockFilters} />);
    expect(screen.getByTestId('card-CITIZENS_REACHED')).toBeInTheDocument();
    expect(screen.getByTestId('card-ALERT_TIMELINE')).toBeInTheDocument();
  });

  it('renders empty message when no types available', () => {
    vi.mocked(useVisibleReportTypes).mockReturnValue([]);
    render(<ReportGeneratorPanel filters={mockFilters} />);
    expect(
      screen.getByText('No reports available for your role.'),
    ).toBeInTheDocument();
  });

  it('generates report with selected type and formatted filters', async () => {
    const user = userEvent.setup();
    render(<ReportGeneratorPanel filters={mockFilters} />);

    await user.click(screen.getByTestId('card-CITIZENS_REACHED'));
    await user.click(
      screen.getByRole('button', { name: 'Generate Report Preview' }),
    );

    expect(mockGenerate).toHaveBeenCalledWith('CITIZENS_REACHED', {
      from: '2026-09-09',
      to: '2026-10-09',
      district: undefined,
      hazardType: 'Flood',
    });
  });

  it('exports report with selected format', async () => {
    const user = userEvent.setup();
    render(<ReportGeneratorPanel filters={mockFilters} />);

    await user.click(screen.getByTestId('card-CITIZENS_REACHED'));
    await user.click(screen.getByText('Export CSV'));

    expect(mockExportAs).toHaveBeenCalledWith('CITIZENS_REACHED', 'CSV', {
      from: '2026-09-09',
      to: '2026-10-09',
      district: undefined,
      hazardType: 'Flood',
    });
  });

  it('shows error if generator fails', () => {
    vi.mocked(useReportGenerator).mockReturnValue({
      report: null,
      isLoading: false,
      error: 'Failed to generate',
      generate: mockGenerate,
      exportAs: mockExportAs,
    });

    render(<ReportGeneratorPanel filters={mockFilters} />);
    expect(screen.getByText('Failed to generate')).toBeInTheDocument();
  });
});
