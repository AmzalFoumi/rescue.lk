import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  HazardReportDto,
  SubmitHazardReportRequest,
} from '@rescue-lk/shared';
import { ApiError } from '@/lib/api';
import { ReportingHeader } from '../components/ReportingHeader';
import { useReporting } from '../state/reporting-context';
import {
  fakeDistrictsApi,
  fakeHazardReportsApi,
  renderWithReporting,
  sampleReport,
} from '../testing/test-support';
import { CitizenHome } from './CitizenHome';
import { MyReportsScreen } from './MyReportsScreen';
import { NewReportScreen } from './NewReportScreen';

vi.mock('next/navigation', () => ({ usePathname: () => '/hazard-reports' }));

const gpsPosition = {
  coords: { latitude: 6.7, longitude: 80.4, accuracy: 12 },
};

beforeEach(() => {
  // A phone that answers at once, like a browser that has permission.
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: (success: (position: typeof gpsPosition) => void) =>
        success(gpsPosition),
    },
  });
});

/** Puts one report in the offline queue as soon as it appears (for tests of what the queue shows). */
function SaveOneReport() {
  const { save } = useReporting().queue;
  useEffect(() => {
    save({
      savedAt: '2026-10-08T09:00:00.000Z',
      request: {
        hazardType: 'fire',
        description: 'Smoke near the market',
        location: { latitude: 6.68, longitude: 80.39 },
        district: 'd-rat',
        capturedAt: '2026-10-08T09:00:00.000Z',
        reporterId: 'citizen-nimal',
        reporterRole: 'citizen',
      } satisfies SubmitHazardReportRequest,
    });
  }, [save]);
  return null;
}

async function fillValidReport(description = 'Water is rising on Main Street') {
  await userEvent.click(await screen.findByRole('radio', { name: 'Flood' }));
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByText(/accurate to 12 m/);
  await userEvent.type(screen.getByLabelText('Description'), description);
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await userEvent.click(
    screen.getByRole('button', { name: 'Skip and continue' }),
  );
}

describe('NewReportScreen, online', () => {
  it('walks through the four steps and sends the report', async () => {
    const { hazardReports } = renderWithReporting(<NewReportScreen />);

    await fillValidReport();
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit report' }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Report sent' }),
    ).toBeInTheDocument();
    expect(hazardReports.submit).toHaveBeenCalledWith(
      expect.objectContaining({
        hazardType: 'flood',
        description: 'Water is rising on Main Street',
        district: 'd-rat',
        location: { latitude: 6.7, longitude: 80.4 },
        reporterId: 'citizen-nimal',
        reporterRole: 'citizen',
      }),
    );
  });

  it('shows the error summary when the reporter continues without choosing a type', async () => {
    renderWithReporting(<NewReportScreen />);
    await screen.findByRole('radio', { name: 'Flood' });

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Fix 1 item to continue',
    );
    expect(
      screen.getAllByText('Choose the type of hazard.').length,
    ).toBeGreaterThan(0);
  });

  it('asks for a longer description on step 2', async () => {
    renderWithReporting(<NewReportScreen />);
    await userEvent.click(await screen.findByRole('radio', { name: 'Fire' }));
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText(/accurate to 12 m/);
    await userEvent.type(screen.getByLabelText('Description'), 'short');

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Describe what you see in at least 10 characters.',
    );
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
  });

  it('lets the reporter go back and edit from the review screen', async () => {
    renderWithReporting(<NewReportScreen />);
    await fillValidReport();

    await userEvent.click(
      screen.getByRole('button', { name: 'Edit Hazard type' }),
    );

    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Flood' })).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
  });

  it('sends a manual location as the district centre with the landmark as the place name', async () => {
    const { hazardReports } = renderWithReporting(<NewReportScreen />);
    await userEvent.click(
      await screen.findByRole('radio', { name: 'Landslide' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await userEvent.click(
      screen.getByRole('button', { name: 'Enter location manually instead' }),
    );
    await userEvent.selectOptions(screen.getByLabelText('District'), 'Colombo');
    await userEvent.type(
      screen.getByLabelText('Nearest town or landmark'),
      'Fort bus stand',
    );
    await userEvent.type(
      screen.getByLabelText('Description'),
      'Soil is sliding onto the road',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Skip and continue' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit report' }),
    );

    await screen.findByRole('heading', { name: 'Report sent' });
    expect(hazardReports.submit).toHaveBeenCalledWith(
      expect.objectContaining({
        district: 'd-col',
        placeName: 'Fort bus stand',
        location: { latitude: 6.9271, longitude: 79.8612 },
      }),
    );
  });

  it('shows why sending failed and stays on the review screen', async () => {
    const hazardReports = fakeHazardReportsApi({
      submit: vi
        .fn()
        .mockRejectedValue(
          new ApiError(400, ['description should not be empty']),
        ),
    });
    renderWithReporting(<NewReportScreen />, { hazardReports });
    await fillValidReport();

    await userEvent.click(
      screen.getByRole('button', { name: 'Submit report' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'description should not be empty',
    );
    expect(screen.getByRole('button', { name: 'Submit report' })).toBeEnabled();
  });

  it('tells the reporter about a possible duplicate after sending (scenario 8.a)', async () => {
    const hazardReports = fakeHazardReportsApi({
      submit: vi
        .fn()
        .mockResolvedValue(sampleReport({ possibleDuplicateOf: ['abc'] })),
    });
    renderWithReporting(<NewReportScreen />, { hazardReports });
    await fillValidReport();

    await userEvent.click(
      screen.getByRole('button', { name: 'Submit report' }),
    );

    expect(await screen.findByText(/Possible duplicate/)).toBeInTheDocument();
  });

  it('starts a new empty report from the result screen', async () => {
    renderWithReporting(<NewReportScreen />);
    await fillValidReport();
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit report' }),
    );
    await screen.findByRole('heading', { name: 'Report sent' });

    await userEvent.click(
      screen.getByRole('button', { name: 'Report another hazard' }),
    );

    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Flood' })).not.toBeChecked();
  });
});

describe('NewReportScreen, loading the districts', () => {
  it('shows an error with a retry when the districts cannot be loaded', async () => {
    const districts = {
      list: vi
        .fn()
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValue([]),
    };
    renderWithReporting(<NewReportScreen />, { districts });

    expect(await screen.findByRole('alert')).toHaveTextContent('offline');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('was not found');
  });

  it('explains when the home district is missing from the list', async () => {
    const districts = fakeDistrictsApi([
      {
        id: 'd-col',
        name: 'Colombo',
        province: 'Western',
        latitude: 6.9,
        longitude: 79.8,
      },
    ]);
    renderWithReporting(<NewReportScreen />, { districts });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The district Ratnapura was not found',
    );
  });
});

describe('NewReportScreen, offline and sync', () => {
  function renderOffline(apis = {}) {
    return renderWithReporting(
      <>
        <ReportingHeader />
        <NewReportScreen />
      </>,
      apis,
    );
  }

  it('saves the report on the phone instead of sending it', async () => {
    const { hazardReports } = renderOffline();
    await userEvent.click(screen.getByRole('switch'));
    await fillValidReport();

    expect(screen.getByText(/No internet connection/)).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Save report on this phone' }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Saved on this phone' }),
    ).toBeInTheDocument();
    expect(hazardReports.queueOffline).toHaveBeenCalled();
    expect(hazardReports.submit).not.toHaveBeenCalled();
  });

  it('sends the saved report when the network comes back and says so', async () => {
    const { hazardReports } = renderOffline();
    await userEvent.click(screen.getByRole('switch'));
    await fillValidReport();
    await userEvent.click(
      screen.getByRole('button', { name: 'Save report on this phone' }),
    );
    await screen.findByRole('heading', { name: 'Saved on this phone' });

    await userEvent.click(screen.getByRole('switch'));

    await waitFor(() => expect(hazardReports.sync).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByText(
        '1 report sent. Status is now Pending Verification.',
      ),
    ).toBeInTheDocument();
  });

  it('says when a saved report could not be sent and keeps it (scenario 9.b)', async () => {
    const hazardReports = fakeHazardReportsApi({
      sync: vi.fn().mockResolvedValue({ synced: 0, stillQueued: 1 }),
    });
    renderOffline({ hazardReports });
    await userEvent.click(screen.getByRole('switch'));
    await fillValidReport();
    await userEvent.click(
      screen.getByRole('button', { name: 'Save report on this phone' }),
    );
    await screen.findByRole('heading', { name: 'Saved on this phone' });

    await userEvent.click(screen.getByRole('switch'));

    expect(
      await screen.findByText(
        '1 report could not be sent. They stay saved and will be retried.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument();
  });
});

describe('MyReportsScreen', () => {
  it('lists the reports of the citizen with their status', async () => {
    const hazardReports = fakeHazardReportsApi({
      listByReporter: vi.fn().mockResolvedValue([
        sampleReport({
          id: 'aaaa0001',
          status: 'verified',
          verifiedBy: 'operator-kj',
          verifiedAt: '2026-10-07T11:00:00.000Z',
        }),
        sampleReport({
          id: 'aaaa0002',
          status: 'rejected',
          rejectionReason: 'Not a hazard',
        }),
      ]),
    });
    renderWithReporting(<MyReportsScreen />, { hazardReports });

    expect(await screen.findAllByRole('article')).toHaveLength(2);
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('Reason: Not a hazard')).toBeInTheDocument();
    expect(screen.getByText(/Verified by K\. Jayawardena/)).toBeInTheDocument();
  });

  it('shows a loading message first', () => {
    renderWithReporting(<MyReportsScreen />, {
      hazardReports: fakeHazardReportsApi({
        listByReporter: vi.fn(() => new Promise<HazardReportDto[]>(() => {})),
      }),
    });
    expect(screen.getByRole('status', { name: '' })).toHaveTextContent(
      'Loading…',
    );
  });

  it('shows an empty message when there are no reports', async () => {
    renderWithReporting(<MyReportsScreen />);
    expect(
      await screen.findByText('You have not sent any reports yet.'),
    ).toBeInTheDocument();
  });

  it('shows an error with a retry', async () => {
    const hazardReports = fakeHazardReportsApi({
      listByReporter: vi
        .fn()
        .mockRejectedValueOnce(new ApiError(0, ['Could not reach the server.']))
        .mockResolvedValue([]),
    });
    renderWithReporting(<MyReportsScreen />, { hazardReports });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not reach the server.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(
      await screen.findByText('You have not sent any reports yet.'),
    ).toBeInTheDocument();
  });

  it('puts a report that is still on the phone above the others', async () => {
    const hazardReports = fakeHazardReportsApi({
      listByReporter: vi.fn().mockResolvedValue([sampleReport()]),
    });
    renderWithReporting(
      <>
        <SaveOneReport />
        <MyReportsScreen />
      </>,
      { hazardReports },
    );

    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2));
    const cards = screen.getAllByRole('article');
    expect(cards[0]).toHaveTextContent('Fire');
    expect(cards[0]).toHaveTextContent('Pending Synchronisation');
    expect(cards[0]).toHaveTextContent('Saved on this phone');
  });
});

describe('CitizenHome', () => {
  it('greets the citizen and links the things they can do', () => {
    renderWithReporting(<CitizenHome />);

    expect(
      screen.getByRole('heading', { name: 'Good day, Nimal' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Ratnapura District')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Report hazard/ })).toHaveAttribute(
      'href',
      '/hazard-reports/new',
    );
    for (const link of screen.getAllByRole('link', { name: /My Reports/ })) {
      expect(link).toHaveAttribute('href', '/hazard-reports/mine');
    }
  });

  it('links the Warnings tile to the warnings page of UC1', () => {
    renderWithReporting(<CitizenHome />);
    expect(screen.getByRole('link', { name: /Warnings/ })).toHaveAttribute(
      'href',
      '/warnings',
    );
  });

  it('says how many reports are waiting to be sent', async () => {
    renderWithReporting(
      <>
        <SaveOneReport />
        <CitizenHome />
      </>,
    );
    expect(await screen.findByText('1 waiting to send')).toBeInTheDocument();
  });
});

describe('rendering without a provider', () => {
  it('fails clearly', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<CitizenHome />)).toThrow('inside ReportingProvider');
    errorSpy.mockRestore();
  });
});
