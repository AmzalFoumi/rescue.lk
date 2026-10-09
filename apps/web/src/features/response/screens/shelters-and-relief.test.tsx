import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import {
  fakeResponseApi,
  renderWithApis,
  sampleRelief,
  sampleShelter,
} from '../testing/test-support';
import { ResponseOperationsScreen } from './ResponseOperationsScreen';

async function openTab(name: RegExp) {
  await screen.findByText('Active incidents');
  await userEvent.click(screen.getByRole('tab', { name }));
}

describe('Shelters tab', () => {
  it('lists shelters with their status and free places', async () => {
    renderWithApis(<ResponseOperationsScreen />);
    await openTab(/shelters/i);

    expect(
      screen.getAllByText('Kandy Central College Hall').length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('Total (1 shelters)')).toBeInTheDocument();
  });

  it('sends arriving evacuees as a change, not as a total', async () => {
    const { response } = renderWithApis(<ResponseOperationsScreen />);
    await openTab(/shelters/i);

    await userEvent.selectOptions(
      screen.getByLabelText('Shelter'),
      sampleShelter().id,
    );
    await userEvent.type(screen.getByLabelText('Number of people'), '25');
    await userEvent.click(
      screen.getByRole('button', { name: /assign shelter/i }),
    );

    await waitFor(() => {
      expect(response.changeOccupancy).toHaveBeenCalledWith(
        sampleShelter().id,
        25,
      );
    });
    expect(
      await screen.findByText('25 people sent to Kandy Central College Hall.'),
    ).toBeInTheDocument();
  });

  it('blocks evacuees being sent to a full shelter before any request', async () => {
    const full = sampleShelter({
      status: 'full',
      currentOccupancy: 400,
      placesAvailable: 0,
    });
    const response = fakeResponseApi({
      listShelters: vi.fn(async () => [full]),
    });
    renderWithApis(<ResponseOperationsScreen />, { response });
    await openTab(/shelters/i);

    await userEvent.selectOptions(screen.getByLabelText('Shelter'), full.id);
    await userEvent.type(screen.getByLabelText('Number of people'), '1');
    await userEvent.click(
      screen.getByRole('button', { name: /assign shelter/i }),
    );

    expect(
      await screen.findByText(/is full\. choose another/i),
    ).toBeInTheDocument();
    expect(response.changeOccupancy).not.toHaveBeenCalled();
  });

  it('asks for a shelter before it will assign anyone', async () => {
    const { response } = renderWithApis(<ResponseOperationsScreen />);
    await openTab(/shelters/i);

    await userEvent.click(
      screen.getByRole('button', { name: /assign shelter/i }),
    );

    expect(
      await screen.findByText('Choose a shelter first.'),
    ).toBeInTheDocument();
    expect(response.changeOccupancy).not.toHaveBeenCalled();
  });

  it('turns a typed total into the change the API wants', async () => {
    const { response } = renderWithApis(<ResponseOperationsScreen />);
    await openTab(/shelters/i);

    const input = screen.getByLabelText(/people in kandy central/i);
    await userEvent.clear(input);
    await userEvent.type(input, '140');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      // 100 in the shelter already, so 140 is 40 more.
      expect(response.changeOccupancy).toHaveBeenCalledWith(
        sampleShelter().id,
        40,
      );
    });
  });

  it('refuses a total above the capacity without calling the API', async () => {
    const { response } = renderWithApis(<ResponseOperationsScreen />);
    await openTab(/shelters/i);

    const input = screen.getByLabelText(/people in kandy central/i);
    await userEvent.clear(input);
    await userEvent.type(input, '500');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText(/holds 400 people/i)).toBeInTheDocument();
    expect(response.changeOccupancy).not.toHaveBeenCalled();
  });

  it('shows the API conflict when the shelter filled up meanwhile', async () => {
    const response = fakeResponseApi({
      changeOccupancy: vi.fn(async () => {
        throw new ApiError(409, ['Kandy Central College Hall is full.']);
      }),
    });
    renderWithApis(<ResponseOperationsScreen />, { response });
    await openTab(/shelters/i);

    await userEvent.selectOptions(
      screen.getByLabelText('Shelter'),
      sampleShelter().id,
    );
    await userEvent.type(screen.getByLabelText('Number of people'), '5');
    await userEvent.click(
      screen.getByRole('button', { name: /assign shelter/i }),
    );

    expect(
      await screen.findByText('Kandy Central College Hall is full.'),
    ).toBeInTheDocument();
  });

  it('filters the shelter list by status', async () => {
    const response = fakeResponseApi({
      listShelters: vi.fn(async () => [
        sampleShelter(),
        sampleShelter({
          id: 's2',
          name: 'Colombo Municipal Hall',
          status: 'full',
          placesAvailable: 0,
        }),
      ]),
    });
    renderWithApis(<ResponseOperationsScreen />, { response });
    await openTab(/shelters/i);

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'full');

    const table = screen.getByRole('table', { name: 'Shelters' });
    expect(
      within(table).getByText('Colombo Municipal Hall'),
    ).toBeInTheDocument();
    expect(
      within(table).queryByText('Kandy Central College Hall'),
    ).not.toBeInTheDocument();
  });
});

describe('Relief tab', () => {
  it('lists what has already gone out', async () => {
    renderWithApis(<ResponseOperationsScreen />);
    await openTab(/relief/i);

    const table = screen.getByRole('table', {
      name: 'Relief distribution records',
    });
    expect(within(table).getByText('Water')).toBeInTheDocument();
    expect(within(table).getByText('500')).toBeInTheDocument();
  });

  it('logs a distribution with its item, quantity, district and owner', async () => {
    const { response } = renderWithApis(<ResponseOperationsScreen />);
    await openTab(/relief/i);

    await userEvent.selectOptions(screen.getByLabelText('Item'), 'medicine');
    await userEvent.type(screen.getByLabelText('Quantity'), '120');
    await userEvent.selectOptions(
      screen.getByLabelText('Destination district'),
      'd-kan',
    );
    await userEvent.selectOptions(
      screen.getByLabelText('Supplied by'),
      'org-redcross',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /log distribution/i }),
    );

    await waitFor(() => {
      expect(response.logRelief).toHaveBeenCalledWith({
        item: 'medicine',
        quantity: 120,
        district: 'd-kan',
        owner: expect.objectContaining({ organisationId: 'org-redcross' }),
      });
    });
    expect(await screen.findByText('120 medicine logged.')).toBeInTheDocument();
  });

  it('names every missing field instead of sending the form', async () => {
    const { response } = renderWithApis(<ResponseOperationsScreen />);
    await openTab(/relief/i);

    await userEvent.click(
      screen.getByRole('button', { name: /log distribution/i }),
    );

    expect(
      await screen.findByText('Choose what was distributed.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Enter how many units went out.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Choose the district it went to.'),
    ).toBeInTheDocument();
    expect(response.logRelief).not.toHaveBeenCalled();
  });

  it('adds the quantities up per district', async () => {
    const response = fakeResponseApi({
      listRelief: vi.fn(async () => [
        sampleRelief({ district: 'd-kan', quantity: 100 }),
        sampleRelief({ id: 'r2', district: 'd-col', quantity: 300 }),
      ]),
    });
    renderWithApis(<ResponseOperationsScreen />, { response });
    await openTab(/relief/i);

    expect(
      screen.getByText('400 items in total, all organisations.'),
    ).toBeInTheDocument();
  });

  it('says so when nothing has been distributed yet', async () => {
    const response = fakeResponseApi({ listRelief: vi.fn(async () => []) });
    renderWithApis(<ResponseOperationsScreen />, { response });
    await openTab(/relief/i);

    expect(
      screen.getByText('Nothing has been distributed yet.'),
    ).toBeInTheDocument();
  });
});

describe('Overview tab', () => {
  it('filters the incident list and says how many are shown', async () => {
    renderWithApis(<ResponseOperationsScreen />);
    await screen.findByText('Active incidents');

    expect(screen.getByText('Showing 1 of 1 incidents.')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Search incidents'), 'pettah');

    expect(screen.getByText('Showing 0 of 1 incidents.')).toBeInTheDocument();
  });

  it('shows the relief totals and the shelters beside the incidents', async () => {
    renderWithApis(<ResponseOperationsScreen />);
    await screen.findByText('Active incidents');

    expect(
      screen.getByText('Relief distributed by district'),
    ).toBeInTheDocument();
    expect(screen.getByText('Shelter status')).toBeInTheDocument();
    expect(screen.getByText('No team is out right now.')).toBeInTheDocument();
  });
});
