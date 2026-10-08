import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithReporting } from '@/features/hazard-reports/testing/test-support';
import HazardReportsPage from './page';
import MyReportsPage from './mine/page';
import NewReportPage from './new/page';
import VerifyReportsPage from './verify/page';

vi.mock('next/navigation', () => ({ usePathname: () => '/hazard-reports' }));

// The pages only choose a screen. The screens themselves are tested in src/features/hazard-reports.
describe('hazard report pages', () => {
  it('shows the citizen home', () => {
    renderWithReporting(<HazardReportsPage />);
    expect(
      screen.getByRole('heading', { name: /Good day/ }),
    ).toBeInTheDocument();
  });

  it('shows the report form', async () => {
    renderWithReporting(<NewReportPage />);
    expect(
      await screen.findByRole('radio', { name: 'Flood' }),
    ).toBeInTheDocument();
  });

  it('shows My Reports', () => {
    renderWithReporting(<MyReportsPage />);
    expect(
      screen.getByRole('heading', { name: 'My Reports' }),
    ).toBeInTheDocument();
  });

  it('shows the operator page', async () => {
    renderWithReporting(<VerifyReportsPage />);
    expect(
      await screen.findByRole('heading', { name: 'Verify Reports' }),
    ).toBeInTheDocument();
  });
});
