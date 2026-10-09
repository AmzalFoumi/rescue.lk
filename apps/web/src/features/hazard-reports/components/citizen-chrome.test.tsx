import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Siren } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { toReportCard } from '../domain/report-card';
import { renderWithReporting, sampleReport } from '../testing/test-support';
import { BottomNav } from './BottomNav';
import { ConnectionBanner } from './ConnectionBanner';
import { HomeTile } from './HomeTile';
import { ReportCard } from './ReportCard';
import { ReportingHeader } from './ReportingHeader';

const mockPathname = vi.hoisted(() => ({ value: '/hazard-reports' }));
vi.mock('next/navigation', () => ({ usePathname: () => mockPathname.value }));

describe('ConnectionBanner', () => {
  const idle = { phase: 'idle' } as const;

  it('shows nothing when online and idle', () => {
    const { container } = render(
      <ConnectionBanner
        online
        syncState={idle}
        onRetry={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('explains offline mode', () => {
    render(
      <ConnectionBanner
        online={false}
        syncState={idle}
        onRetry={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('You are offline');
  });

  it('offers to try again after a partial failure (scenario 9.b)', async () => {
    const onRetry = vi.fn();
    render(
      <ConnectionBanner
        online
        syncState={{ phase: 'done', synced: 0, stillQueued: 1 }}
        onRetry={onRetry}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      '1 report could not be sent',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalled();
  });

  it('lets the reporter dismiss a success message', async () => {
    const onDismiss = vi.fn();
    render(
      <ConnectionBanner
        online
        syncState={{ phase: 'done', synced: 2, stillQueued: 0 }}
        onRetry={vi.fn()}
        onDismiss={onDismiss}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(onDismiss).toHaveBeenCalled();
  });
});

describe('ReportCard', () => {
  const districts = [
    {
      id: 'd-rat',
      name: 'Ratnapura',
      province: 'S',
      latitude: 6.6,
      longitude: 80.3,
    },
  ];

  it('shows the report with its short id, place and status', () => {
    render(<ReportCard card={toReportCard(sampleReport(), districts)} />);
    expect(screen.getByRole('heading', { name: /Flood/ })).toHaveTextContent(
      'R-8E36',
    );
    expect(screen.getByText(/Ratnapura ·/)).toBeInTheDocument();
    expect(screen.getByText('Pending Verification')).toBeInTheDocument();
    expect(
      screen.getByText('Water is rising on Main Street'),
    ).toBeInTheDocument();
  });

  it('shows the reason of a rejected report', () => {
    const report = sampleReport({
      status: 'rejected',
      rejectionReason: 'Not a hazard',
    });
    render(<ReportCard card={toReportCard(report, districts)} />);
    expect(screen.getByText('Reason: Not a hazard')).toBeInTheDocument();
  });

  it('shows the possible-duplicate notice', () => {
    render(
      <ReportCard
        card={toReportCard(
          sampleReport({ possibleDuplicateOf: ['x'] }),
          districts,
        )}
      />,
    );
    expect(screen.getByText(/Possible duplicate/)).toBeInTheDocument();
  });
});

describe('HomeTile', () => {
  it('is a link with a title and a subtitle', () => {
    render(
      <HomeTile
        href="/somewhere"
        icon={Siren}
        title="Warnings"
        subtitle="Alerts for your district"
      />,
    );
    const link = screen.getByRole('link', { name: /Warnings/ });
    expect(link).toHaveAttribute('href', '/somewhere');
    expect(link).toHaveTextContent('Alerts for your district');
  });
});

describe('BottomNav', () => {
  it('links the three citizen screens and marks the current one', () => {
    mockPathname.value = '/hazard-reports/mine';
    render(<BottomNav />);

    expect(screen.getAllByRole('link')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'My Reports' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
      'aria-current',
    );
  });
});

describe('ReportingHeader', () => {
  it('shows the network switch and flips it', async () => {
    renderWithReporting(<ReportingHeader />);

    const toggle = screen.getByRole('switch', { name: /Network: Online/ });
    await userEvent.click(toggle);

    expect(
      screen.getByRole('switch', { name: /Network: Offline/ }),
    ).not.toBeChecked();
  });

  it('links to the citizen app and the operator view', () => {
    renderWithReporting(<ReportingHeader />);
    expect(screen.getByRole('link', { name: 'Citizen app' })).toHaveAttribute(
      'href',
      '/hazard-reports',
    );
    expect(screen.getByRole('link', { name: 'DMC Operator' })).toHaveAttribute(
      'href',
      '/hazard-reports/verify',
    );
  });
});
