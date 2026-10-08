import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { DeliveryRecordDto, WarningDto } from '@rescue-lk/shared';
import type { DeliveryView } from '../../delivery';
import { EMPTY_FORM } from '../../form';
import { WarningsPanel } from '../monitor/WarningsPanel';
import { AreaStep } from './AreaStep';
import { DeliveryStep } from './DeliveryStep';

const WARNING_ID = '665f1b2c9d3e4a0012345670';

const warning = (overrides: Partial<WarningDto> = {}): WarningDto => ({
  id: WARNING_ID,
  sourceReportId: '665f1b2c9d3e4a00000000a1',
  hazard: 'FLOOD',
  otherHazard: '',
  severity: 'HIGH',
  areaIds: ['B-KALU'],
  message: 'The Kalu Ganga is rising quickly.',
  instructions: 'Move to higher ground.\nKeep a torch ready.',
  channels: ['SMS', 'SIREN'],
  status: 'ACTIVE',
  version: 1,
  createdBy: 'Officer',
  createdAt: '2026-10-08T05:00:00.000Z',
  publishedAt: '2026-10-08T05:10:00.000Z',
  updatedAt: null,
  cancelledAt: null,
  cancelReason: '',
  ...overrides,
});

const record = (overrides: Partial<DeliveryRecordDto>): DeliveryRecordDto => ({
  id: 'd-sms',
  warningId: WARNING_ID,
  warningVersion: 1,
  channel: 'SMS',
  status: 'SENT',
  attempts: 2,
  recipients: 240000,
  lastAttemptAt: '2026-10-08T05:11:00.000Z',
  error: '',
  ...overrides,
});

describe('DeliveryStep', () => {
  const view = (overrides: Partial<DeliveryView> = {}): DeliveryView => ({
    warning: warning(),
    records: [
      record({}),
      record({
        id: 'd-siren',
        channel: 'SIREN',
        status: 'FAILED',
        attempts: 3,
      }),
    ],
    kpis: { target: 240000, delivered: 240000, pending: 0, failed: 0 },
    timeline: [],
    subtitle: 'Kalu Ganga basin · Ratnapura, Kalutara · version 1',
    ...overrides,
  });

  const renderStep = (deliveryView: DeliveryView) => {
    const handlers = {
      onBack: vi.fn(),
      onRetry: vi.fn(),
      onRetryAll: vi.fn(),
      onUpdate: vi.fn(),
      onCancel: vi.fn(),
    };
    render(
      <DeliveryStep
        view={deliveryView}
        loading={false}
        retryError={null}
        busy={false}
        updatedAt={null}
        {...handlers}
      />,
    );
    return handlers;
  };

  it('shows the KPIs, the message and the instructions', () => {
    renderStep(view());

    expect(screen.getByText('Target citizens')).toBeInTheDocument();
    expect(screen.getByText('Sent (100.0%)')).toBeInTheDocument();
    expect(
      screen.getByText('The Kalu Ganga is rising quickly.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Keep a torch ready.')).toBeInTheDocument();
  });

  it('offers to retry every failed channel, update and cancel an ACTIVE warning', () => {
    const handlers = renderStep(view());

    fireEvent.click(
      screen.getByRole('button', { name: 'Retry failed channels (1)' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Update warning' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel warning' }));

    expect(handlers.onRetryAll).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'd-siren' }),
    ]);
    expect(handlers.onUpdate).toHaveBeenCalled();
    expect(handlers.onCancel).toHaveBeenCalled();
  });

  it('offers no update or cancel once cancelled, and says why it was cancelled', () => {
    renderStep(
      view({
        warning: warning({
          status: 'CANCELLED',
          cancelledAt: '2026-10-08T07:00:00.000Z',
          cancelReason: 'River level has fallen.',
        }),
        records: [record({})],
      }),
    );

    expect(screen.queryByRole('button', { name: 'Update warning' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel warning' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Retry failed/ })).toBeNull();
    expect(screen.getByText(/River level has fallen\./)).toBeInTheDocument();
  });
});

describe('WarningsPanel', () => {
  const renderPanel = (warnings: WarningDto[], tab: WarningDto['status']) => {
    const onOpen = vi.fn();
    const onTabChange = vi.fn();
    render(
      <WarningsPanel
        tab={tab}
        counts={{ DRAFT: 1, ACTIVE: warnings.length, CANCELLED: 0 }}
        onTabChange={onTabChange}
        warnings={warnings}
        deliveries={{ [WARNING_ID]: [record({})] }}
        areaNames={{ 'B-KALU': 'Kalu Ganga basin' }}
        onOpen={onOpen}
      />,
    );
    return { onOpen, onTabChange };
  };

  it('lists each warning with its area, delivery chips and an open button', () => {
    const { onOpen } = renderPanel([warning()], 'ACTIVE');

    expect(screen.getByText('Flood · Kalu Ganga basin')).toBeInTheDocument();
    const chips = screen.getByRole('list', { name: 'Delivery by channel' });
    expect(within(chips).getByRole('listitem')).toHaveTextContent('SMS: Sent');

    fireEvent.click(screen.getByRole('button', { name: /Delivery status/ }));
    expect(onOpen).toHaveBeenCalledWith(warning());
  });

  it('opens a draft from the Draft tab', () => {
    renderPanel([warning({ status: 'DRAFT', publishedAt: null })], 'DRAFT');

    expect(
      screen.getByRole('button', { name: /Open draft/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Draft saved/)).toBeInTheDocument();
  });

  it('says when a tab is empty and switches tabs', () => {
    const { onTabChange } = renderPanel([], 'CANCELLED');

    expect(screen.getByText('No cancelled warnings.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /Draft/ }));
    expect(onTabChange).toHaveBeenCalledWith('DRAFT');
  });
});

describe('AreaStep', () => {
  const renderStep = (
    overrides: Partial<Parameters<typeof AreaStep>[0]> = {},
  ) => {
    const props = {
      values: { ...EMPTY_FORM, severity: 'HIGH' as const },
      errors: {},
      areas: [],
      report: undefined,
      reach: null,
      editorLabel: 'New warning',
      canSaveDraft: true,
      isUpdate: false,
      failure: null,
      busy: false,
      updatedAt: null,
      onFieldChange: vi.fn(),
      onBack: vi.fn(),
      onSaveDraft: vi.fn(),
      onReview: vi.fn(),
      ...overrides,
    };
    render(<AreaStep {...props} />);
    return props;
  };

  it('saves a draft or opens the publish review for a new warning', () => {
    const props = renderStep();

    fireEvent.click(screen.getByRole('button', { name: 'Save as draft' }));
    fireEvent.click(screen.getByRole('button', { name: 'Review and publish' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Back to warning level' }),
    );

    expect(props.onSaveDraft).toHaveBeenCalled();
    expect(props.onReview).toHaveBeenCalled();
    expect(props.onBack).toHaveBeenCalled();
  });

  it('only reviews an update, without a draft option', () => {
    renderStep({
      canSaveDraft: false,
      isUpdate: true,
      editorLabel: 'Updating W-345670',
    });

    expect(screen.queryByRole('button', { name: 'Save as draft' })).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Review update' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Updating W-345670')).toBeInTheDocument();
  });

  it('shows how many fields need attention, naming those on the level step', () => {
    renderStep({ errors: { hazard: 'Choose.', message: 'Too short.' } });

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('2 fields need attention');
    expect(alert).toHaveTextContent('On the warning level step: Hazard type.');
  });
});
