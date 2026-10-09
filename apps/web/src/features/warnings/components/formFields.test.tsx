import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { TargetAreaDto, VerifiedHazardReportDto } from '@rescue-lk/shared';
import { EMPTY_FORM } from '../form';
import { AssessmentPanel } from './level/AssessmentPanel';
import { AreaSelector } from './area/AreaSelector';
import { MessageFields } from './area/MessageFields';
import { ChannelSelector } from './ChannelSelector';

const report = {
  id: '665f1b2c9d3e4a00000000a1',
  hazardType: 'FLOOD',
  place: 'Ratnapura town',
  districtName: 'Ratnapura',
} as VerifiedHazardReportDto;

const areas: TargetAreaDto[] = [
  {
    id: 'D-RATNAPURA',
    kind: 'DISTRICT',
    name: 'Ratnapura District',
    districts: ['Ratnapura'],
  },
  {
    id: 'D-GALLE',
    kind: 'DISTRICT',
    name: 'Galle District',
    districts: ['Galle'],
  },
  {
    id: 'B-KALU',
    kind: 'RIVER_BASIN',
    name: 'Kalu Ganga basin',
    districts: ['Ratnapura', 'Kalutara'],
  },
];

// An input shows its error, is marked invalid, and points to the message.
const expectLinkedError = (input: HTMLElement, message: string) => {
  expect(input).toHaveAttribute('aria-invalid', 'true');
  const describedBy = input.getAttribute('aria-describedby') ?? '';
  const ids = describedBy.split(' ');
  const texts = ids.map((id) => document.getElementById(id)?.textContent);
  expect(texts).toContain(message);
};

describe('warning form fields show the API field errors', () => {
  it('AssessmentPanel: report, hazard and level errors, linked to their inputs', () => {
    render(
      <AssessmentPanel
        values={EMPTY_FORM}
        errors={{
          sourceReportId: 'Select the verified report.',
          hazard: 'Choose a hazard type.',
          severity: 'Choose a warning level.',
        }}
        reports={[report]}
        sourceLocked={false}
        onSourceChange={vi.fn()}
        onFieldChange={vi.fn()}
      />,
    );

    expectLinkedError(
      screen.getByLabelText('Source report'),
      'Select the verified report.',
    );
    expectLinkedError(
      screen.getByLabelText('Hazard type'),
      'Choose a hazard type.',
    );
    expect(
      screen.getByRole('group', { name: 'Select warning level' }),
    ).toHaveAccessibleDescription('Choose a warning level.');
  });

  it('AssessmentPanel: picking a report, hazard and level reports the change', () => {
    const onSourceChange = vi.fn();
    const onFieldChange = vi.fn();
    render(
      <AssessmentPanel
        values={EMPTY_FORM}
        errors={{}}
        reports={[report]}
        sourceLocked={false}
        onSourceChange={onSourceChange}
        onFieldChange={onFieldChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('Source report'), {
      target: { value: report.id },
    });
    fireEvent.change(screen.getByLabelText('Hazard type'), {
      target: { value: 'OTHER' },
    });
    fireEvent.click(screen.getByRole('radio', { name: /Critical/ }));

    expect(onSourceChange).toHaveBeenCalledWith(report.id);
    expect(onFieldChange).toHaveBeenCalledWith('hazard', 'OTHER');
    expect(onFieldChange).toHaveBeenCalledWith('severity', 'CRITICAL');
  });

  it('AssessmentPanel: locks the source report of an update', () => {
    render(
      <AssessmentPanel
        values={{ ...EMPTY_FORM, sourceReportId: report.id }}
        errors={{}}
        reports={[report]}
        sourceLocked
        onSourceChange={vi.fn()}
        onFieldChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Source report')).toBeDisabled();
  });

  it('AssessmentPanel: asks for a name when the hazard is OTHER', () => {
    render(
      <AssessmentPanel
        values={{ ...EMPTY_FORM, hazard: 'OTHER' }}
        errors={{ otherHazard: 'Name the hazard.' }}
        reports={[]}
        sourceLocked={false}
        onSourceChange={vi.fn()}
        onFieldChange={vi.fn()}
      />,
    );

    expectLinkedError(
      screen.getByLabelText('Name of hazard'),
      'Name the hazard.',
    );
  });

  it('MessageFields: message and instruction errors, with the character count', () => {
    const onFieldChange = vi.fn();
    render(
      <MessageFields
        message="Too short"
        instructions=""
        errors={{
          message: 'Write a message of at least 20 characters.',
          instructions: 'Add at least one safety instruction.',
        }}
        onFieldChange={onFieldChange}
      />,
    );

    const message = screen.getByLabelText('Message');
    expectLinkedError(message, 'Write a message of at least 20 characters.');
    expect(message).toHaveAccessibleDescription(/9 characters/);
    expectLinkedError(
      screen.getByLabelText('Safety instructions'),
      'Add at least one safety instruction.',
    );

    fireEvent.change(message, { target: { value: 'Water rising fast' } });
    expect(onFieldChange).toHaveBeenCalledWith('message', 'Water rising fast');
  });

  it('ChannelSelector: shows its error and toggles channels in display order', () => {
    const onChange = vi.fn();
    render(
      <ChannelSelector
        value={['SIREN']}
        onChange={onChange}
        error="Select at least one channel."
      />,
    );

    expect(
      screen.getByText('Select at least one channel.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: /^SMS/ }));
    expect(onChange).toHaveBeenCalledWith(['SMS', 'SIREN']);
  });

  it('AreaSelector: searches, toggles areas and shows its error', () => {
    const onChange = vi.fn();
    render(
      <AreaSelector
        areas={areas}
        value={['D-RATNAPURA']}
        onChange={onChange}
        error="Add at least one district or river basin."
      />,
    );

    expect(
      screen.getByText('Add at least one district or river basin.'),
    ).toBeInTheDocument();
    fireEvent.change(
      screen.getByLabelText('Search districts or river basins'),
      {
        target: { value: 'kalu' },
      },
    );
    expect(screen.queryByRole('checkbox', { name: 'Galle' })).toBeNull();

    const basins = screen.getByRole('group', { name: 'River basins' });
    fireEvent.click(within(basins).getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(['D-RATNAPURA', 'B-KALU']);
  });
});
