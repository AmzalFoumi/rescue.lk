import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import type { TargetAreaDto, VerifiedHazardReportDto } from '@rescue-lk/shared';
import { api } from '@/lib/api';
import { WarningWorkflow } from './WarningWorkflow';

vi.mock('@/lib/api', () => ({
  api: {
    warnings: {
      list: vi.fn(),
      verifiedReports: vi.fn(),
      targetAreas: vi.fn(),
      reach: vi.fn(),
      deliveries: vi.fn(),
    },
  },
}));

const warningsApi = vi.mocked(api.warnings);

const report: VerifiedHazardReportDto = {
  id: '665f1b2c9d3e4a00000000a1',
  hazardType: 'flood',
  district: 'd1',
  districtName: 'Ratnapura',
  place: 'Ratnapura town',
  reporter: 'Nimal Perera',
  status: 'verified',
  description: 'Kalu Ganga overflowing',
  submittedAt: '2026-10-08T03:55:00.000Z',
  verifiedAt: '2026-10-08T04:20:00.000Z',
  verifiedBy: 'K. Jayawardena',
};

const areas: TargetAreaDto[] = [
  {
    id: 'D-RATNAPURA',
    kind: 'DISTRICT',
    name: 'Ratnapura District',
    districts: ['Ratnapura'],
  },
];

// The screen end to end with the API mocked: monitoring, review, level.
describe('WarningWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    warningsApi.list.mockResolvedValue([]);
    warningsApi.verifiedReports.mockResolvedValue([report]);
    warningsApi.targetAreas.mockResolvedValue(areas);
    warningsApi.reach.mockResolvedValue({
      districts: ['Ratnapura'],
      channels: [{ channel: 'SMS', recipients: 120000 }],
    });
    warningsApi.deliveries.mockResolvedValue([]);
  });

  it('goes from monitoring to review to the warning level step', async () => {
    render(<WarningWorkflow />);

    expect(
      await screen.findByRole('heading', { name: 'Hazard monitoring' }),
    ).toBeInTheDocument();
    await screen.findByText('Ratnapura town, Ratnapura');
    // In the reports table (the status filter also has a "No warning yet" option).
    expect(
      within(screen.getByRole('table')).getByText('No warning yet'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Review R-0000A1' }));
    expect(
      screen.getByRole('heading', { name: 'Hazard review' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Reported by Nimal Perera through the rescue.lk app.'),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Proceed to warning level' }),
    );
    expect(
      screen.getByRole('heading', { name: 'Warning level selection' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Source report')).toHaveValue(report.id);
    // The district's SMS reach comes from the API's estimate.
    await waitFor(() =>
      expect(screen.getByText('120,000')).toBeInTheDocument(),
    );
  });

  it('stays on the level step and shows what is missing', async () => {
    render(<WarningWorkflow />);
    await screen.findByText('Ratnapura town, Ratnapura');
    fireEvent.click(screen.getByRole('button', { name: 'Create warning' }));

    fireEvent.click(
      screen.getByRole('button', { name: 'Continue to affected area' }),
    );

    expect(
      screen.getByRole('heading', { name: 'Warning level selection' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Choose a warning level.')).toBeInTheDocument();
  });

  it('shows a failed load with a way to try again', async () => {
    warningsApi.list.mockRejectedValue(new TypeError('Failed to fetch'));
    render(<WarningWorkflow />);

    expect(
      await screen.findByText(/Could not reach the server/),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Try again' }),
    ).not.toHaveLength(0);
  });
});
