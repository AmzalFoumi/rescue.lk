import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportPreviewTable } from './ReportPreviewTable';

describe('ReportPreviewTable', () => {
  it('shows empty message when report is null', () => {
    render(<ReportPreviewTable report={null} />);
    expect(
      screen.getByText(
        'Select a report type and click Generate to see the preview.',
      ),
    ).toBeInTheDocument();
  });

  it('renders table headers and rows based on report data', () => {
    const report = {
      type: 'CITIZENS_REACHED' as const,
      title: 'Citizens Reached',
      description: 'Statistics',
      generatedAt: '2026-10-09T10:00:00Z',
      filters: { from: '2026-09-09', to: '2026-10-09' },
      columns: [
        { key: 'district', label: 'District', align: 'left' as const },
        { key: 'count', label: 'Count', align: 'right' as const },
        { key: 'status', label: 'Status', align: 'center' as const },
      ],
      rows: [{ district: 'Colombo', count: 100, status: 'Active' }],
    };

    render(<ReportPreviewTable report={report} />);

    expect(screen.getByText('Citizens Reached')).toBeInTheDocument();
    expect(screen.getByText('Statistics')).toBeInTheDocument();
    expect(screen.getByText('District')).toBeInTheDocument();
    expect(screen.getByText('Count')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Colombo')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows empty rows message when there are no rows', () => {
    const report = {
      type: 'CITIZENS_REACHED' as const,
      title: 'Citizens Reached',
      description: 'Statistics',
      generatedAt: '2026-10-09T10:00:00Z',
      filters: { from: '2026-09-09', to: '2026-10-09' },
      columns: [{ key: 'district', label: 'District', align: 'left' as const }],
      rows: [],
    };

    render(<ReportPreviewTable report={report} />);
    expect(
      screen.getByText('No data found for the selected filters.'),
    ).toBeInTheDocument();
  });
});
