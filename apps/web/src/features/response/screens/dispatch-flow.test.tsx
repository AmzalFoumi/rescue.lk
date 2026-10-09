import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import {
  DISTRICTS,
  NGO_OWNER,
  fakeResponseApi,
  renderWithApis,
  sampleReport,
  sampleTeam,
} from '../testing/test-support';
import { ResponseOperationsScreen } from './ResponseOperationsScreen';

/** Clicks through to the Dispatch tab of the Response Operations page. */
async function openDispatchTab() {
  await userEvent.click(screen.getByRole('tab', { name: /dispatch team/i }));
}

async function chooseIncident() {
  await userEvent.click(await screen.findByRole('radio', { name: /flood/i }));
}

describe('Dispatch Rescue Team', () => {
  it('shows the officer and the four tabs once the data is in', async () => {
    renderWithApis(<ResponseOperationsScreen />);

    expect(
      await screen.findByRole('heading', { name: 'Response Operations' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(4);
  });

  it('counts the incidents, the teams and the shelter places at the top', async () => {
    renderWithApis(<ResponseOperationsScreen />);

    expect(await screen.findByText('Active incidents')).toBeInTheDocument();
    // Also the name of a filter option, so the card is found by its sub-line.
    expect(screen.getByText('Need dispatch')).toBeInTheDocument();
    expect(screen.getByText('0 of 1')).toBeInTheDocument();
    // The same figure appears on the overview's shelter panel.
    expect(screen.getAllByText('100 / 400').length).toBeGreaterThan(0);
  });

  it('keeps Dispatch off until an incident is chosen (steps 1 and 2)', async () => {
    renderWithApis(<ResponseOperationsScreen />);
    await screen.findByText('Active incidents');
    await openDispatchTab();

    expect(screen.getByText('Step 1 · Now')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dispatch' })).toBeDisabled();

    await chooseIncident();

    expect(screen.getByText('Step 2 · Now')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dispatch' })).toBeEnabled();
  });

  it('asks to confirm before committing a team (step 7)', async () => {
    const { response } = renderWithApis(<ResponseOperationsScreen />);
    await screen.findByText('Active incidents');
    await openDispatchTab();
    await chooseIncident();

    await userEvent.click(screen.getByRole('button', { name: 'Dispatch' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Army Rescue Unit 3');
    expect(dialog).toHaveTextContent('Sri Lanka Army (Armed forces)');
    expect(dialog).toHaveTextContent(/availability is checked again/i);
    expect(response.dispatch).not.toHaveBeenCalled();
  });

  it('sends the report, the team and the officer when confirmed', async () => {
    const { response } = renderWithApis(<ResponseOperationsScreen />);
    await screen.findByText('Active incidents');
    await openDispatchTab();
    await chooseIncident();
    await userEvent.click(screen.getByRole('button', { name: 'Dispatch' }));

    await userEvent.click(
      screen.getByRole('button', { name: 'Confirm dispatch' }),
    );

    await waitFor(() => {
      expect(response.dispatch).toHaveBeenCalledWith(
        sampleReport().id,
        sampleTeam().id,
        'officer-sp',
      );
    });
    expect(
      await screen.findByText('Army Rescue Unit 3 is on the way.'),
    ).toBeInTheDocument();
  });

  it('closes the dialog without dispatching when the officer goes back', async () => {
    const { response } = renderWithApis(<ResponseOperationsScreen />);
    await screen.findByText('Active incidents');
    await openDispatchTab();
    await chooseIncident();
    await userEvent.click(screen.getByRole('button', { name: 'Dispatch' }));

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(response.dispatch).not.toHaveBeenCalled();
  });

  // Extension 7.a: the team was taken while the officer was deciding.
  it('shows the conflict when the team was assigned elsewhere', async () => {
    const response = fakeResponseApi({
      dispatch: vi.fn(async () => {
        throw new ApiError(409, [
          'Army Rescue Unit 3 was assigned elsewhere. Choose another team.',
        ]);
      }),
    });
    renderWithApis(<ResponseOperationsScreen />, { response });
    await screen.findByText('Active incidents');
    await openDispatchTab();
    await chooseIncident();
    await userEvent.click(screen.getByRole('button', { name: 'Dispatch' }));

    await userEvent.click(
      screen.getByRole('button', { name: 'Confirm dispatch' }),
    );

    expect(
      await screen.findByText(/assigned elsewhere. choose another team/i),
    ).toBeInTheDocument();
    // The dialog stays open so another team can be chosen.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  // Extension 5.a: nothing to dispatch.
  it('says no team is available and offers to widen the search', async () => {
    const response = fakeResponseApi({
      listTeams: vi.fn(async () => ({
        teams: [sampleTeam({ status: 'dispatched' })],
        availableCount: 0,
      })),
    });
    renderWithApis(<ResponseOperationsScreen />, { response });
    await screen.findByText('Active incidents');
    await openDispatchTab();
    await chooseIncident();

    expect(screen.getByText('No team available.')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: /show all districts/i }),
    );
    expect(screen.getByText('No team available.')).toBeInTheDocument();
  });

  it('hides teams from other districts until the officer widens the search', async () => {
    const response = fakeResponseApi({
      listTeams: vi.fn(async () => ({
        teams: [
          sampleTeam(),
          sampleTeam({
            id: 't-col',
            name: 'Navy Flood Response Team',
            owner: NGO_OWNER,
            district: 'd-col',
          }),
        ],
        availableCount: 2,
      })),
    });
    renderWithApis(<ResponseOperationsScreen />, { response });
    await screen.findByText('Active incidents');
    await openDispatchTab();
    await chooseIncident();

    expect(
      screen.queryByText('Navy Flood Response Team'),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('checkbox', { name: /only kandy/i }),
    );

    expect(screen.getByText('Navy Flood Response Team')).toBeInTheDocument();
  });

  it('filters the team list by owner', async () => {
    const response = fakeResponseApi({
      listTeams: vi.fn(async () => ({
        teams: [
          sampleTeam(),
          sampleTeam({
            id: 't2',
            name: 'Red Cross Mobile Team 1',
            owner: NGO_OWNER,
          }),
        ],
        availableCount: 2,
      })),
    });
    renderWithApis(<ResponseOperationsScreen />, { response });
    await screen.findByText('Active incidents');
    await openDispatchTab();

    await userEvent.selectOptions(screen.getByLabelText('Owner'), 'ngo');

    expect(screen.getByText('Red Cross Mobile Team 1')).toBeInTheDocument();
    expect(screen.queryByText('Army Rescue Unit 3')).not.toBeInTheDocument();
  });

  it('updates a team status, but never to Dispatched', async () => {
    const response = fakeResponseApi({
      listTeams: vi.fn(async () => ({
        teams: [sampleTeam({ status: 'dispatched' })],
        availableCount: 0,
      })),
    });
    renderWithApis(<ResponseOperationsScreen />, { response });
    await screen.findByText('Active incidents');
    await openDispatchTab();

    await userEvent.selectOptions(
      screen.getByLabelText(/change the status of army rescue unit 3/i),
      'returning',
    );

    await waitFor(() => {
      expect(response.changeTeamStatus).toHaveBeenCalledWith(
        sampleTeam().id,
        'returning',
      );
    });
    expect(
      await screen.findByText('Army Rescue Unit 3 is now returning.'),
    ).toBeInTheDocument();
  });

  it('tells the officer when a status change fails', async () => {
    const response = fakeResponseApi({
      listTeams: vi.fn(async () => ({
        teams: [sampleTeam({ status: 'dispatched' })],
        availableCount: 0,
      })),
      changeTeamStatus: vi.fn(async () => {
        throw new ApiError(409, ['A dispatched team cannot become available']);
      }),
    });
    renderWithApis(<ResponseOperationsScreen />, { response });
    await screen.findByText('Active incidents');
    await openDispatchTab();

    await userEvent.selectOptions(
      screen.getByLabelText(/change the status of/i),
      'returning',
    );

    expect(
      await screen.findByText(/cannot become available/i),
    ).toBeInTheDocument();
  });

  it('says so when no verified report is waiting', async () => {
    const response = fakeResponseApi({ listReports: vi.fn(async () => []) });
    renderWithApis(<ResponseOperationsScreen />, { response });
    await screen.findByText('Active incidents');
    await openDispatchTab();

    expect(
      screen.getByText(/no verified report is waiting for a response/i),
    ).toBeInTheDocument();
  });

  it('shows an error with a retry when the lists cannot be loaded', async () => {
    const response = fakeResponseApi({
      listReports: vi.fn(async () => {
        throw new ApiError(500, ['The server is down.']);
      }),
    });
    renderWithApis(<ResponseOperationsScreen />, { response });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The server is down.',
    );
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(response.listReports).toHaveBeenCalledTimes(2);
  });

  it('jumps from the overview straight to dispatching the chosen incident', async () => {
    renderWithApis(<ResponseOperationsScreen />);
    await screen.findByText('Active incidents');

    await userEvent.click(
      screen.getByRole('button', { name: /dispatch a team to the flood/i }),
    );

    expect(screen.getByText('Step 2 · Now')).toBeInTheDocument();
    expect(
      screen.getByText(/dispatching to riverside road, kandy/i),
    ).toBeInTheDocument();
  });

  it('clears the chosen incident when the officer asks', async () => {
    renderWithApis(<ResponseOperationsScreen />);
    await screen.findByText('Active incidents');
    await openDispatchTab();
    await chooseIncident();

    await userEvent.click(
      screen.getByRole('button', { name: /clear incident/i }),
    );

    expect(screen.getByText('Step 1 · Now')).toBeInTheDocument();
  });

  it('is only ever one district away from showing every owner', async () => {
    renderWithApis(<ResponseOperationsScreen />);
    await screen.findByText('Active incidents');
    await openDispatchTab();

    expect(screen.getByLabelText('Owner')).toHaveValue('all');
    expect(DISTRICTS).toHaveLength(2);
  });
});
