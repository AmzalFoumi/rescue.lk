import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { DeliveryRecordDto, DeliveryStatus } from '@rescue-lk/shared';
import { ApiError } from '@/lib/api-error';
import { CancelDialog } from './CancelDialog';
import { DeliveryStatusTable } from './DeliveryStatusTable';
import { PublishDialog } from './PublishDialog';

const record = (
  status: DeliveryStatus,
  overrides: Partial<DeliveryRecordDto> = {},
): DeliveryRecordDto => ({
  id: `record-${status}`,
  warningId: 'w1',
  warningVersion: 1,
  channel: 'SMS',
  status,
  attempts: 1,
  recipients: 120000,
  lastAttemptAt: '2026-10-08T05:11:00.000Z',
  error: '',
  ...overrides,
});

describe('DeliveryStatusTable', () => {
  it('offers Retry only on a FAILED delivery', () => {
    const onRetry = vi.fn();
    render(
      <DeliveryStatusTable
        records={[
          record('SENT'),
          record('FAILED', {
            channel: 'SIREN',
            attempts: 3,
            error: 'No acknowledgement from the siren controller',
          }),
          record('RETRYING', { channel: 'PUSH' }),
        ]}
        loading={false}
        onRetry={onRetry}
      />,
    );

    const retryButtons = screen.getAllByRole('button', { name: /Retry/ });
    expect(retryButtons).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Retry Public siren' }));
    expect(onRetry).toHaveBeenCalledWith('record-FAILED');
  });

  it('shows status as text, attempts out of the automatic limit, recipients and the error', () => {
    render(
      <DeliveryStatusTable
        records={[
          record('SENT', { attempts: 2 }),
          record('FAILED', { id: 'f', channel: 'PUSH', error: 'Gateway down' }),
        ]}
        loading={false}
        onRetry={vi.fn()}
      />,
    );

    const [sms, push] = screen.getAllByRole('row').slice(1);
    expect(within(sms).getByText('Sent')).toBeInTheDocument();
    expect(within(sms).getByText('2 / 3')).toBeInTheDocument();
    expect(within(sms).getByText('120,000 people')).toBeInTheDocument();
    expect(within(push).getByText('Failed')).toBeInTheDocument();
    expect(within(push).getByText('Gateway down')).toBeInTheDocument();
    expect(within(push).getByText('–', { selector: 'td' })).toBeInTheDocument();
  });

  it('disables Retry while a retry is running', () => {
    render(
      <DeliveryStatusTable
        records={[record('FAILED')]}
        loading={false}
        onRetry={vi.fn()}
        retryDisabled
      />,
    );

    expect(screen.getByRole('button', { name: /Retry/ })).toBeDisabled();
  });

  it('says when there are no deliveries yet', () => {
    render(
      <DeliveryStatusTable records={[]} loading={false} onRetry={vi.fn()} />,
    );

    expect(
      screen.getByText('No deliveries for this warning yet.'),
    ).toBeInTheDocument();
  });
});

describe('CancelDialog', () => {
  const renderDialog = (
    overrides: Partial<Parameters<typeof CancelDialog>[0]> = {},
  ) => {
    const props = {
      title: 'Cancel warning W-345670?',
      description: 'Flood warning for Ratnapura District.',
      pending: false,
      error: null,
      onConfirm: vi.fn(),
      onClose: vi.fn(),
      ...overrides,
    };
    render(<CancelDialog {...props} />);
    return props;
  };

  it('is a labelled modal dialog', () => {
    renderDialog();

    expect(
      screen.getByRole('dialog', { name: 'Cancel warning W-345670?' }),
    ).toHaveAttribute('aria-modal', 'true');
  });

  it('needs a reason before it can cancel', () => {
    const props = renderDialog();
    const confirm = screen.getByRole('button', { name: 'Cancel warning' });

    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Reason for cancelling/), {
      target: { value: '   ' },
    });
    expect(confirm).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Reason for cancelling/), {
      target: { value: '  River level has fallen.  ' },
    });
    fireEvent.click(confirm);
    expect(props.onConfirm).toHaveBeenCalledWith('River level has fallen.');
  });

  it('shows the API error under the reason', () => {
    renderDialog({
      error: new ApiError({
        status: 400,
        message: 'Warning failed validation',
        fieldErrors: { cancelReason: 'Give a reason for cancelling.' },
      }),
    });

    expect(
      screen.getByLabelText(/Reason for cancelling/),
    ).toHaveAccessibleDescription('Give a reason for cancelling.');
  });

  it('closes with Keep warning or Escape', () => {
    const props = renderDialog();

    fireEvent.click(screen.getByRole('button', { name: 'Keep warning' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(props.onClose).toHaveBeenCalledTimes(2);
  });
});

describe('PublishDialog', () => {
  const renderDialog = (
    overrides: Partial<Parameters<typeof PublishDialog>[0]> = {},
  ) => {
    const props = {
      title: 'Publish this warning?',
      severity: 'HIGH' as const,
      hazard: 'flood' as const,
      hazardLabel: 'Flood',
      summary: [{ label: 'Target area', value: 'Kalu Ganga basin' }],
      canSaveDraft: true,
      confirmLabel: 'Confirm and publish',
      pending: false,
      onConfirm: vi.fn(),
      onSaveDraft: vi.fn(),
      onClose: vi.fn(),
      ...overrides,
    };
    render(<PublishDialog {...props} />);
    return props;
  };

  it('shows the summary, severity and hazard', () => {
    renderDialog();

    const dialog = screen.getByRole('dialog', {
      name: 'Publish this warning?',
    });
    expect(within(dialog).getByText('Kalu Ganga basin')).toBeInTheDocument();
    expect(within(dialog).getByText('High')).toBeInTheDocument();
    expect(within(dialog).getByText('Flood')).toBeInTheDocument();
  });

  it('can only confirm once every check is ticked', () => {
    const props = renderDialog();
    const confirm = screen.getByRole('button', { name: /Confirm and publish/ });
    const checks = screen.getAllByRole('checkbox');

    expect(checks).toHaveLength(4);
    checks.slice(0, 3).forEach((check) => fireEvent.click(check));
    expect(confirm).toBeDisabled();

    fireEvent.click(checks[3]);
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(props.onConfirm).toHaveBeenCalled();
  });

  it('offers Save as draft for a new warning but not for an update', () => {
    const props = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Save as draft' }));
    expect(props.onSaveDraft).toHaveBeenCalled();
  });

  it('has no Save as draft when sending an update', () => {
    renderDialog({
      canSaveDraft: false,
      confirmLabel: 'Confirm and send update',
    });

    expect(screen.queryByRole('button', { name: 'Save as draft' })).toBeNull();
    expect(
      screen.getByRole('button', { name: /Confirm and send update/ }),
    ).toBeInTheDocument();
  });

  it('moves focus into the dialog and keeps Tab inside it', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog');
    const goBack = screen.getByRole('button', { name: 'Go back' });

    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    goBack.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });
});
