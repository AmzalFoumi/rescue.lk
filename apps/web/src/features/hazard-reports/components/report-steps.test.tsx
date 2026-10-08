import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DistrictDto } from '@rescue-lk/shared';
import { DRAFT_MESSAGES, EMPTY_DRAFT } from '../domain/report-draft';
import type { LocationDraft } from '../domain/report-draft';
import { buildReviewRows } from '../domain/review-rows';
import type { SubmitOutcome } from '../hooks/use-submit-report';
import { sampleReport } from '../testing/test-support';
import { DetailsStep } from './DetailsStep';
import { ErrorSummary } from './ErrorSummary';
import { HazardTypeStep } from './HazardTypeStep';
import { PhotoStep } from './PhotoStep';
import { ReviewStep, OFFLINE_REVIEW_NOTICE } from './ReviewStep';
import { SubmitResult } from './SubmitResult';

const districts: DistrictDto[] = [
  {
    id: 'd-gal',
    name: 'Galle',
    province: 'Southern',
    latitude: 6.05,
    longitude: 80.22,
  },
];

// The GPS panel asks the phone for a position; these tests are about the form, so it is replaced.
vi.mock('../hooks/use-geolocation', () => ({
  useGeolocation: () => ({ status: 'locating', locate: vi.fn() }),
}));

describe('HazardTypeStep', () => {
  it('lists the five types and tells the wizard which one was chosen', async () => {
    const onChange = vi.fn();
    render(
      <HazardTypeStep
        hazardType={null}
        otherHazard=""
        errors={{}}
        onChange={onChange}
      />,
    );

    expect(screen.getAllByRole('radio')).toHaveLength(5);
    await userEvent.click(screen.getByRole('radio', { name: 'Landslide' }));

    expect(onChange).toHaveBeenCalledWith({ hazardType: 'landslide' });
  });

  it('shows the error under the choices', () => {
    render(
      <HazardTypeStep
        hazardType={null}
        otherHazard=""
        errors={{ hazardType: DRAFT_MESSAGES.hazardType }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Choose the type of hazard.')).toBeInTheDocument();
  });

  it('asks "What kind of hazard?" only for the other type', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <HazardTypeStep
        hazardType="flood"
        otherHazard=""
        errors={{}}
        onChange={onChange}
      />,
    );
    expect(screen.queryByLabelText('What kind of hazard?')).toBeNull();

    rerender(
      <HazardTypeStep
        hazardType="other"
        otherHazard=""
        errors={{ otherHazard: DRAFT_MESSAGES.otherHazard }}
        onChange={onChange}
      />,
    );
    await userEvent.type(screen.getByLabelText('What kind of hazard?'), 'x');

    expect(onChange).toHaveBeenCalledWith({ otherHazard: 'x' });
    expect(
      screen.getByText('Say what kind of hazard it is.'),
    ).toBeInTheDocument();
  });
});

describe('DetailsStep', () => {
  it('shows the GPS panel first and the description box', () => {
    render(
      <DetailsStep
        draft={EMPTY_DRAFT}
        districts={districts}
        errors={{}}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Use current location (GPS)')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('passes the description to the wizard as it is typed', async () => {
    const onChange = vi.fn();
    render(
      <DetailsStep
        draft={EMPTY_DRAFT}
        districts={districts}
        errors={{}}
        onChange={onChange}
      />,
    );

    await userEvent.type(screen.getByLabelText('Description'), 'a');

    expect(onChange).toHaveBeenCalledWith({ description: 'a' });
  });

  it('shows the description and location errors', () => {
    render(
      <DetailsStep
        draft={EMPTY_DRAFT}
        districts={districts}
        errors={{
          location: DRAFT_MESSAGES.locationMissing,
          description: DRAFT_MESSAGES.descriptionShort,
        }}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByText(DRAFT_MESSAGES.locationMissing),
    ).toBeInTheDocument();
    expect(
      screen.getByText(DRAFT_MESSAGES.descriptionShort),
    ).toBeInTheDocument();
  });

  it('switches to a manual location with a district list and back to GPS', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <DetailsStep
        draft={EMPTY_DRAFT}
        districts={districts}
        errors={{}}
        onChange={onChange}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Enter location manually instead' }),
    );
    expect(onChange).toHaveBeenCalledWith({
      location: { source: 'manual', districtId: '', landmark: '' },
    });

    const manual: LocationDraft = {
      source: 'manual',
      districtId: '',
      landmark: '',
    };
    rerender(
      <DetailsStep
        draft={{ ...EMPTY_DRAFT, location: manual }}
        districts={districts}
        errors={{}}
        onChange={onChange}
      />,
    );
    await userEvent.selectOptions(screen.getByLabelText('District'), 'd-gal');
    expect(onChange).toHaveBeenCalledWith({
      location: { ...manual, districtId: 'd-gal' },
    });

    await userEvent.type(
      screen.getByLabelText('Nearest town or landmark'),
      'F',
    );
    expect(onChange).toHaveBeenCalledWith({
      location: { ...manual, landmark: 'F' },
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'Use my GPS location' }),
    );
    expect(onChange).toHaveBeenLastCalledWith({ location: null });
  });
});

describe('ErrorSummary', () => {
  it('shows nothing when there are no errors', () => {
    const { container } = render(<ErrorSummary errors={{}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('counts one problem', () => {
    render(
      <ErrorSummary errors={{ hazardType: 'Choose the type of hazard.' }} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Fix 1 item to continue',
    );
  });

  it('counts several problems and lists them', () => {
    render(
      <ErrorSummary
        errors={{
          location: 'Location problem',
          description: 'Description problem',
        }}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Fix 2 items to continue',
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});

describe('PhotoStep', () => {
  beforeEach(() => {
    Object.assign(URL, {
      createObjectURL: vi.fn(() => 'blob:preview'),
      revokeObjectURL: vi.fn(),
    });
  });

  it('tells the wizard the file name and shows a preview', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<PhotoStep photo={null} onChange={onChange} />);

    await userEvent.upload(
      screen.getByLabelText('Gallery'),
      new File(['x'], 'flood.jpg', { type: 'image/jpeg' }),
    );
    expect(onChange).toHaveBeenCalledWith({ fileName: 'flood.jpg' });

    rerender(
      <PhotoStep photo={{ fileName: 'flood.jpg' }} onChange={onChange} />,
    );
    expect(screen.getByAltText('Photo preview')).toHaveAttribute(
      'src',
      'blob:preview',
    );
    expect(screen.getByText('flood.jpg')).toBeInTheDocument();
  });

  it('removes the photo and frees the preview', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<PhotoStep photo={null} onChange={onChange} />);
    await userEvent.upload(
      screen.getByLabelText('Take photo'),
      new File(['x'], 'a.jpg', { type: 'image/jpeg' }),
    );
    rerender(<PhotoStep photo={{ fileName: 'a.jpg' }} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Remove photo' }));

    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });

  it('does nothing when no file is chosen', async () => {
    const onChange = vi.fn();
    render(<PhotoStep photo={null} onChange={onChange} />);
    await userEvent.upload(screen.getByLabelText('Gallery'), []);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('frees the preview when the screen closes', async () => {
    const { unmount } = render(<PhotoStep photo={null} onChange={vi.fn()} />);
    await userEvent.upload(
      screen.getByLabelText('Gallery'),
      new File(['x'], 'a.jpg', { type: 'image/jpeg' }),
    );
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });
});

describe('ReviewStep', () => {
  const rows = buildReviewRows(
    {
      ...EMPTY_DRAFT,
      hazardType: 'flood',
      description: 'Water is rising on Main Street',
      location: { source: 'gps', fix: { latitude: 6.68, longitude: 80.39 } },
    },
    districts,
    new Date('2026-10-07T10:43:00Z'),
  );

  it('shows every row and lets the reporter edit the ones that can change', async () => {
    const onEdit = vi.fn();
    render(
      <ReviewStep
        rows={rows}
        online
        submitting={false}
        error={null}
        onEdit={onEdit}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByText('Water is rising on Main Street'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Edit Date and time' }),
    ).toBeNull();

    await userEvent.click(
      screen.getByRole('button', { name: 'Edit Location' }),
    );
    expect(onEdit).toHaveBeenCalledWith(2);
  });

  it('says "Submit report" online and sends on click', async () => {
    const onSubmit = vi.fn();
    render(
      <ReviewStep
        rows={rows}
        online
        submitting={false}
        error={null}
        onEdit={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Submit report' }),
    );

    expect(onSubmit).toHaveBeenCalled();
    expect(screen.queryByText(OFFLINE_REVIEW_NOTICE)).toBeNull();
  });

  it('says "Save report on this phone" and explains why when offline', () => {
    render(
      <ReviewStep
        rows={rows}
        online={false}
        submitting={false}
        error={null}
        onEdit={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Save report on this phone' }),
    ).toBeInTheDocument();
    expect(screen.getByText(OFFLINE_REVIEW_NOTICE)).toBeInTheDocument();
  });

  it('disables the button while sending', () => {
    render(
      <ReviewStep
        rows={rows}
        online
        submitting
        error={null}
        onEdit={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled();
  });

  it('shows why sending failed', () => {
    render(
      <ReviewStep
        rows={rows}
        online
        submitting={false}
        error="district must be a mongodb id"
        onEdit={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'district must be a mongodb id',
    );
  });
});

describe('SubmitResult', () => {
  it('confirms a sent report with its short id and status', () => {
    const outcome: SubmitOutcome = {
      kind: 'sent',
      report: sampleReport({ id: '6ac71f73f776c0e7b5e78e36' }),
    };
    render(<SubmitResult outcome={outcome} onNewReport={vi.fn()} />);

    expect(
      screen.getByRole('heading', { name: 'Report sent' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Pending Verification')).toBeInTheDocument();
    expect(screen.getByText(/R-8E36 has been received/)).toBeInTheDocument();
    expect(screen.queryByText(/Possible duplicate/)).toBeNull();
    expect(
      screen.getByRole('link', { name: 'View my reports' }),
    ).toHaveAttribute('href', '/hazard-reports/mine');
  });

  it('tells the reporter about a possible duplicate (scenario 8.a)', () => {
    const outcome: SubmitOutcome = {
      kind: 'sent',
      report: sampleReport({ possibleDuplicateOf: ['abc'] }),
    };
    render(<SubmitResult outcome={outcome} onNewReport={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('Possible duplicate');
  });

  it('says the report is saved on the phone when it was queued', () => {
    const outcome: SubmitOutcome = {
      kind: 'queued',
      pendingCount: 1,
      queued: {
        localId: 'local-1',
        savedAt: '2026-10-08T10:00:00.000Z',
        request: sampleReport() as never,
      },
    };
    render(<SubmitResult outcome={outcome} onNewReport={vi.fn()} />);

    expect(
      screen.getByRole('heading', { name: 'Saved on this phone' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Pending Synchronisation')).toBeInTheDocument();
    expect(
      screen.getByText(/You do not need to submit it again/),
    ).toBeInTheDocument();
  });

  it('starts a new report on request', async () => {
    const onNewReport = vi.fn();
    const outcome: SubmitOutcome = { kind: 'sent', report: sampleReport() };
    render(<SubmitResult outcome={outcome} onNewReport={onNewReport} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Report another hazard' }),
    );

    expect(onNewReport).toHaveBeenCalled();
  });
});
