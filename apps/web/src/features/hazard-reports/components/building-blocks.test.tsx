import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { HazardReportStatus } from '@rescue-lk/shared';
import { Button } from './Button';
import { ErrorText } from './ErrorText';
import { StateMessage } from './StateMessage';
import { StatusChip } from './StatusChip';
import { WizardProgress } from './WizardProgress';

describe('StatusChip', () => {
  it.each<[HazardReportStatus, string]>([
    ['pending_synchronisation', 'Pending Synchronisation'],
    ['pending_verification', 'Pending Verification'],
    ['verified', 'Verified'],
    ['rejected', 'Rejected'],
  ])('shows the name of %s', (status, label) => {
    render(<StatusChip status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe('Button', () => {
  it('is a plain button that calls onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute(
      'type',
      'button',
    );
  });

  it('cannot be pressed when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('can be a submit button', () => {
    render(
      <Button type="submit" variant="danger">
        Reject
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Reject' })).toHaveAttribute(
      'type',
      'submit',
    );
  });
});

describe('ErrorText', () => {
  it('shows the message', () => {
    render(<ErrorText id="e1">Choose the type of hazard.</ErrorText>);
    expect(screen.getByText('Choose the type of hazard.')).toHaveAttribute(
      'id',
      'e1',
    );
  });
});

describe('StateMessage', () => {
  it('shows a loading message as a status', () => {
    render(<StateMessage kind="loading" />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
  });

  it('shows an empty message', () => {
    render(<StateMessage kind="empty" message="No reports yet." />);
    expect(screen.getByText('No reports yet.')).toBeInTheDocument();
  });

  it('shows an error as an alert with a retry button', async () => {
    const onRetry = vi.fn();
    render(
      <StateMessage kind="error" message="Could not load." onRetry={onRetry} />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Could not load.');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('shows an error without a retry button when there is nothing to retry', () => {
    render(<StateMessage kind="error" />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Something went wrong.',
    );
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('WizardProgress', () => {
  it('shows the step and fills the bar', () => {
    render(<WizardProgress step={2} />);
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '2',
    );
  });
});
