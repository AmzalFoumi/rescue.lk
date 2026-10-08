import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import {
  fakeHazardReportsApi,
  renderWithReporting,
  sampleReport,
} from '../testing/test-support';
import { OperatorVerifyScreen } from './OperatorVerifyScreen';

const first = sampleReport({
  id: 'aaaaaaaaaaaaaaaaaaaa0001',
  description: 'First flood report',
  possibleDuplicateOf: ['aaaaaaaaaaaaaaaaaaaa0002'],
});
const second = sampleReport({
  id: 'aaaaaaaaaaaaaaaaaaaa0002',
  hazardType: 'landslide',
  description: 'Second report about a landslide',
  reporterName: 'Kumari Perera',
});

function apiWith(reports = [first, second], overrides = {}) {
  return fakeHazardReportsApi({
    listPending: vi.fn().mockResolvedValue(reports),
    getById: vi.fn(
      async (id: string) =>
        reports.find((report) => report.id === id) ?? sampleReport({ id }),
    ),
    ...overrides,
  });
}

describe('OperatorVerifyScreen, the list', () => {
  it('lists the pending reports and opens the first one', async () => {
    renderWithReporting(<OperatorVerifyScreen />, { hazardReports: apiWith() });

    expect(
      await screen.findByRole('heading', { name: /Report review/ }),
    ).toHaveTextContent('R-0001');
    expect(
      screen.getByRole('heading', { name: /Pending Verification/ }),
    ).toHaveTextContent('2');
    expect(screen.getByText('First flood report')).toBeInTheDocument();
    expect(screen.getByText('Possible duplicate')).toBeInTheDocument();
  });

  it('opens another report when it is picked', async () => {
    renderWithReporting(<OperatorVerifyScreen />, { hazardReports: apiWith() });
    await screen.findByRole('heading', { name: /Report review/ });

    await userEvent.click(screen.getByRole('button', { name: /Landslide/ }));

    expect(
      screen.getByRole('heading', { name: /Report review/ }),
    ).toHaveTextContent('R-0002');
    expect(
      screen.getByText('Second report about a landslide'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Kumari Perera, citizen/)).toBeInTheDocument();
  });

  it('shows an empty message when nothing is waiting', async () => {
    renderWithReporting(<OperatorVerifyScreen />, {
      hazardReports: apiWith([]),
    });
    expect(
      await screen.findByText('No reports are waiting for verification.'),
    ).toBeInTheDocument();
  });

  it('shows a loading message first', () => {
    const hazardReports = apiWith([], {
      listPending: vi.fn(() => new Promise(() => {})),
    });
    renderWithReporting(<OperatorVerifyScreen />, { hazardReports });
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
  });

  it('shows an error with a retry', async () => {
    const hazardReports = apiWith([first], {
      listPending: vi
        .fn()
        .mockRejectedValueOnce(new ApiError(0, ['Could not reach the server.']))
        .mockResolvedValue([first]),
    });
    renderWithReporting(<OperatorVerifyScreen />, { hazardReports });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not reach the server.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(
      await screen.findByRole('heading', { name: /Report review/ }),
    ).toBeInTheDocument();
  });
});

describe('OperatorVerifyScreen, duplicates', () => {
  it('shows the report that was flagged as a possible duplicate and can open it', async () => {
    renderWithReporting(<OperatorVerifyScreen />, { hazardReports: apiWith() });

    expect(
      await screen.findByText('1 possible duplicate found'),
    ).toBeInTheDocument();
    const panel = screen
      .getByRole('heading', { name: 'Check for duplicates' })
      .closest('section')!;
    expect(within(panel).getByText('R-0002')).toBeInTheDocument();

    await userEvent.click(
      within(panel).getByRole('button', { name: 'Open R-0002' }),
    );

    expect(
      screen.getByRole('heading', { name: /Report review/ }),
    ).toHaveTextContent('R-0002');
  });

  it('says so when there are no duplicates', async () => {
    renderWithReporting(<OperatorVerifyScreen />, {
      hazardReports: apiWith([second]),
    });
    expect(
      await screen.findByText('No possible duplicates found.'),
    ).toBeInTheDocument();
  });

  it('cannot open a duplicate that is no longer in the queue', async () => {
    renderWithReporting(<OperatorVerifyScreen />, {
      hazardReports: apiWith([first]),
    });

    expect(
      await screen.findByText('1 possible duplicate found'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Open R-/ })).toBeNull();
  });
});

describe('OperatorVerifyScreen, deciding', () => {
  it('verifies the report, confirms it and moves on to the next one', async () => {
    const listPending = vi
      .fn()
      .mockResolvedValueOnce([first, second])
      .mockResolvedValue([second]);
    const hazardReports = apiWith([first, second], { listPending });
    renderWithReporting(<OperatorVerifyScreen />, { hazardReports });
    await screen.findByRole('heading', { name: /Report review/ });

    await userEvent.click(
      screen.getByRole('button', { name: 'Verify and make available' }),
    );

    expect(hazardReports.verify).toHaveBeenCalledWith(
      'aaaaaaaaaaaaaaaaaaaa0001',
      'operator-kj',
    );
    expect(
      await screen.findByText(
        /R-0001 verified by K\. Jayawardena at \d\d:\d\d\./,
      ),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /Report review/ }),
      ).toHaveTextContent('R-0002'),
    );
  });

  it('asks for a reason before rejecting, and does not call the API', async () => {
    const hazardReports = apiWith();
    renderWithReporting(<OperatorVerifyScreen />, { hazardReports });
    await screen.findByRole('heading', { name: /Report review/ });

    await userEvent.click(screen.getByRole('button', { name: 'Reject' }));

    expect(
      screen.getByText('Choose a reason. The citizen will see it in the app.'),
    ).toBeInTheDocument();
    expect(hazardReports.reject).not.toHaveBeenCalled();
  });

  it('rejects with the chosen reason and the note', async () => {
    const hazardReports = apiWith();
    renderWithReporting(<OperatorVerifyScreen />, { hazardReports });
    await screen.findByRole('heading', { name: /Report review/ });

    await userEvent.selectOptions(
      screen.getByLabelText(/Rejection reason/),
      'Insufficient information',
    );
    await userEvent.type(
      screen.getByLabelText('Details for the citizen'),
      'No photo',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }));

    await waitFor(() =>
      expect(hazardReports.reject).toHaveBeenCalledWith(
        'aaaaaaaaaaaaaaaaaaaa0001',
        'operator-kj',
        'Insufficient information: No photo',
      ),
    );
    expect(
      await screen.findByText(/R-0001 rejected by K\. Jayawardena/),
    ).toBeInTheDocument();
  });

  it('asks for details when the reason is "other"', async () => {
    renderWithReporting(<OperatorVerifyScreen />, { hazardReports: apiWith() });
    await screen.findByRole('heading', { name: /Report review/ });

    await userEvent.selectOptions(
      screen.getByLabelText(/Rejection reason/),
      'Other',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }));

    expect(
      screen.getByText('Describe the reason in the details box.'),
    ).toBeInTheDocument();
  });

  it('shows the message when the report was already decided (409)', async () => {
    const hazardReports = apiWith([first, second], {
      verify: vi
        .fn()
        .mockRejectedValue(
          new ApiError(409, [
            'Only a pending report can be changed, this one is already verified',
          ]),
        ),
    });
    renderWithReporting(<OperatorVerifyScreen />, { hazardReports });
    await screen.findByRole('heading', { name: /Report review/ });

    await userEvent.click(
      screen.getByRole('button', { name: 'Verify and make available' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'already verified',
    );
  });

  it('closes the confirmation message on dismiss', async () => {
    renderWithReporting(<OperatorVerifyScreen />, { hazardReports: apiWith() });
    await screen.findByRole('heading', { name: /Report review/ });
    await userEvent.click(
      screen.getByRole('button', { name: 'Verify and make available' }),
    );
    await screen.findByText(/verified by/);

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(screen.queryByText(/verified by/)).toBeNull();
  });

  it('can go back to the list on a small screen', async () => {
    renderWithReporting(<OperatorVerifyScreen />, { hazardReports: apiWith() });
    await screen.findByRole('heading', { name: /Report review/ });
    await userEvent.click(screen.getByRole('button', { name: /Landslide/ }));

    await userEvent.click(
      screen.getByRole('button', { name: 'Back to the list' }),
    );

    expect(
      screen.getByRole('button', { name: /Landslide/ }).closest('div'),
    ).toHaveClass('block');
  });
});

describe('OperatorVerifyScreen, loading the duplicates fails', () => {
  it('shows an error inside the duplicates panel and keeps the rest', async () => {
    const hazardReports = apiWith([first], {
      getById: vi.fn().mockRejectedValue(new ApiError(500, ['Server problem'])),
    });
    renderWithReporting(<OperatorVerifyScreen />, { hazardReports });

    expect(await screen.findByText('Server problem')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Verify and make available' }),
    ).toBeInTheDocument();
  });
});
