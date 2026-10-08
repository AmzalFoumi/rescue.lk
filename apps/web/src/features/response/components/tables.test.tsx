import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import {
  DISTRICTS,
  NGO_OWNER,
  sampleRelief,
  sampleReport,
  sampleShelter,
  sampleTeam,
} from '../testing/test-support';
import { IncidentsTable } from './IncidentsTable';
import { KpiCards } from './KpiCards';
import { ReliefTable } from './ReliefTable';
import { ResponseTabs } from './ResponseTabs';
import { SheltersTable } from './SheltersTable';
import { StepBar } from './StepBar';
import { TeamsTable } from './TeamsTable';

describe('IncidentsTable', () => {
  it('shows the hazard, the place and that no team is on it yet', () => {
    render(
      <IncidentsTable
        reports={[sampleReport()]}
        districts={DISTRICTS}
        onDispatch={vi.fn()}
      />,
    );

    expect(screen.getByText('Flood')).toBeInTheDocument();
    expect(screen.getByText('Riverside Road, Kandy')).toBeInTheDocument();
    expect(screen.getByText('No team yet')).toBeInTheDocument();
  });

  it('shows how many teams are already on an incident', () => {
    render(
      <IncidentsTable
        reports={[sampleReport({ needsResponse: false, dispatchedTeams: 2 })]}
        districts={DISTRICTS}
        onDispatch={vi.fn()}
      />,
    );

    expect(screen.getByText('2 teams')).toBeInTheDocument();
  });

  it('asks to dispatch the incident that was pressed', async () => {
    const onDispatch = vi.fn();
    render(
      <IncidentsTable
        reports={[sampleReport()]}
        districts={DISTRICTS}
        onDispatch={onDispatch}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /dispatch/i }));

    expect(onDispatch).toHaveBeenCalledWith(sampleReport());
  });

  it('says so when the filters match nothing', () => {
    render(
      <IncidentsTable
        reports={[]}
        districts={DISTRICTS}
        onDispatch={vi.fn()}
      />,
    );
    expect(screen.getByText(/no incidents match/i)).toBeInTheDocument();
  });
});

describe('TeamsTable', () => {
  const noop = vi.fn();

  it('shows the owner and the kind of organisation beside each team', () => {
    render(
      <TeamsTable
        teams={[sampleTeam(), sampleTeam({ id: 't2', owner: NGO_OWNER })]}
        districts={DISTRICTS}
        canDispatch
        onDispatch={noop}
        onChangeStatus={noop}
      />,
    );

    expect(screen.getByText('Sri Lanka Army')).toBeInTheDocument();
    expect(screen.getByText('Armed forces')).toBeInTheDocument();
    expect(screen.getByText('NGO')).toBeInTheDocument();
  });

  it('turns Dispatch off until an incident has been chosen', () => {
    render(
      <TeamsTable
        teams={[sampleTeam()]}
        districts={DISTRICTS}
        canDispatch={false}
        onDispatch={noop}
        onChangeStatus={noop}
      />,
    );

    expect(screen.getByRole('button', { name: 'Dispatch' })).toBeDisabled();
  });

  it('offers no Dispatch button for a team that is not available', () => {
    render(
      <TeamsTable
        teams={[sampleTeam({ status: 'dispatched' })]}
        districts={DISTRICTS}
        canDispatch
        onDispatch={noop}
        onChangeStatus={noop}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Dispatch' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Dispatched')).toBeInTheDocument();
  });

  it('passes the team on when Dispatch is pressed', async () => {
    const onDispatch = vi.fn();
    render(
      <TeamsTable
        teams={[sampleTeam()]}
        districts={DISTRICTS}
        canDispatch
        onDispatch={onDispatch}
        onChangeStatus={noop}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Dispatch' }));

    expect(onDispatch).toHaveBeenCalledWith(sampleTeam());
  });

  it('never offers Dispatched in the status menu', async () => {
    const onChangeStatus = vi.fn();
    render(
      <TeamsTable
        teams={[sampleTeam({ status: 'dispatched' })]}
        districts={DISTRICTS}
        canDispatch
        onDispatch={noop}
        onChangeStatus={onChangeStatus}
      />,
    );

    const menu = screen.getByRole('combobox');
    expect(
      screen.queryByRole('option', { name: 'Dispatched' }),
    ).not.toBeInTheDocument();

    await userEvent.selectOptions(menu, 'returning');
    expect(onChangeStatus).toHaveBeenCalledWith(
      sampleTeam({ status: 'dispatched' }),
      'returning',
    );
  });

  it('says so when the filters match no team', () => {
    render(
      <TeamsTable
        teams={[]}
        districts={DISTRICTS}
        canDispatch
        onDispatch={noop}
        onChangeStatus={noop}
      />,
    );
    expect(screen.getByText(/no teams match/i)).toBeInTheDocument();
  });
});

describe('SheltersTable', () => {
  it('adds the rows up into a total that matches them', () => {
    render(
      <SheltersTable
        shelters={[
          sampleShelter({
            capacity: 400,
            currentOccupancy: 320,
            placesAvailable: 80,
          }),
          sampleShelter({
            id: 's2',
            capacity: 200,
            currentOccupancy: 100,
            placesAvailable: 100,
          }),
        ]}
        districts={DISTRICTS}
        edits={{}}
        errors={{}}
        onEdit={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText('Total (2 shelters)')).toBeInTheDocument();
    expect(screen.getByText('420 / 600 · 70%')).toBeInTheDocument();
  });

  it('shows the status word next to the occupancy', () => {
    render(
      <SheltersTable
        shelters={[sampleShelter({ status: 'full', placesAvailable: 0 })]}
        districts={DISTRICTS}
        edits={{}}
        errors={{}}
        onEdit={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText('Full')).toBeInTheDocument();
  });

  it('reports what was typed and asks to save it', async () => {
    const onEdit = vi.fn();
    const onSave = vi.fn();
    render(
      <SheltersTable
        shelters={[sampleShelter()]}
        districts={DISTRICTS}
        edits={{}}
        errors={{}}
        onEdit={onEdit}
        onSave={onSave}
      />,
    );

    await userEvent.type(
      screen.getByLabelText(/people in kandy central/i),
      '5',
    );
    expect(onEdit).toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith(sampleShelter());
  });

  it('shows the error for the row it belongs to', () => {
    render(
      <SheltersTable
        shelters={[sampleShelter()]}
        districts={DISTRICTS}
        edits={{}}
        errors={{ [sampleShelter().id]: 'It is full.' }}
        onEdit={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('It is full.');
  });

  it('says so when the filters match no shelter', () => {
    render(
      <SheltersTable
        shelters={[]}
        districts={DISTRICTS}
        edits={{}}
        errors={{}}
        onEdit={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByText(/no shelters match/i)).toBeInTheDocument();
  });
});

describe('ReliefTable', () => {
  it('shows the item, the quantity, the owner and the district', () => {
    render(
      <ReliefTable distributions={[sampleRelief()]} districts={DISTRICTS} />,
    );

    expect(screen.getByText('Water')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('Sri Lanka Red Cross')).toBeInTheDocument();
    expect(screen.getByText('Kandy')).toBeInTheDocument();
  });

  it('says so when nothing has gone out', () => {
    render(<ReliefTable distributions={[]} districts={DISTRICTS} />);
    expect(screen.getByText(/no relief supplies/i)).toBeInTheDocument();
  });
});

describe('KpiCards', () => {
  it('shows each number with its label', () => {
    render(
      <KpiCards
        kpis={[
          {
            key: 'k',
            label: 'Awaiting a team',
            value: '2',
            sub: 'Need dispatch',
            tone: 'caution',
            icon: 'circle-help',
          },
        ]}
      />,
    );

    expect(screen.getByText('Awaiting a team')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Need dispatch')).toBeInTheDocument();
  });
});

describe('ResponseTabs', () => {
  it('marks the open tab and reports the one that was pressed', async () => {
    const onChange = vi.fn();
    render(<ResponseTabs active="overview" onChange={onChange} />);

    expect(screen.getByRole('tab', { name: /overview/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await userEvent.click(screen.getByRole('tab', { name: /shelters/i }));
    expect(onChange).toHaveBeenCalledWith('shelters');
  });
});

describe('StepBar', () => {
  it('says which step is now and which come next', () => {
    render(<StepBar current={1} />);

    expect(screen.getByText('Step 1 · Done')).toBeInTheDocument();
    expect(screen.getByText('Step 2 · Now')).toBeInTheDocument();
    expect(screen.getByText('Step 3 · Next')).toBeInTheDocument();
  });
});
