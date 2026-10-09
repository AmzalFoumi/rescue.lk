import { describe, it, expect } from 'vitest';
import type { ReachEstimateDto } from '@rescue-lk/shared';
import { EMPTY_FORM } from './form';
import {
  PUBLISH_CHECKS,
  errorBanner,
  messageCountLabel,
  publishSummary,
  reachFor,
} from './publishing';

const reach: ReachEstimateDto = {
  districts: ['Ratnapura', 'Kalutara'],
  channels: [
    { channel: 'SMS', recipients: 240000 },
    { channel: 'PUSH', recipients: 80000 },
    { channel: 'SIREN', recipients: 16 },
  ],
};

describe('messageCountLabel', () => {
  it('counts characters', () => {
    expect(messageCountLabel('')).toBe('0 characters');
    expect(messageCountLabel('x'.repeat(160))).toBe('160 characters');
  });

  it('says how many SMS parts a long message needs', () => {
    expect(messageCountLabel('x'.repeat(161))).toBe(
      '161 characters · sent as 2 SMS parts',
    );
    expect(messageCountLabel('x'.repeat(307))).toBe(
      '307 characters · sent as 3 SMS parts',
    );
  });
});

describe('reachFor', () => {
  it('reads one channel from the estimate', () => {
    expect(reachFor(reach, 'PUSH')).toBe(80000);
    expect(reachFor(null, 'PUSH')).toBeNull();
  });
});

describe('publishSummary', () => {
  it('lists what will be sent and to how many', () => {
    const values = {
      ...EMPTY_FORM,
      sourceReportId: '665f1b2c9d3e4a00000000a1',
      areaIds: ['B-KALU'],
      message: 'The Kalu Ganga is rising.',
      instructions: 'Move to higher ground.\n\nKeep a torch ready.',
      channels: ['SMS' as const, 'SIREN' as const],
    };

    expect(
      publishSummary(values, {
        areaNames: { 'B-KALU': 'Kalu Ganga basin' },
        reach,
      }),
    ).toEqual([
      { label: 'Source report', value: 'R-0000A1' },
      { label: 'Target area', value: 'Kalu Ganga basin' },
      { label: 'Districts', value: 'Ratnapura, Kalutara' },
      {
        label: 'Channels',
        value: 'SMS (240,000 people), Public siren (16 sirens)',
      },
      { label: 'Message', value: 'The Kalu Ganga is rising.' },
      {
        label: 'Safety instructions',
        value: 'Move to higher ground. · Keep a torch ready.',
      },
    ]);
  });

  it('shows dashes before the estimate arrives', () => {
    const rows = publishSummary(
      { ...EMPTY_FORM, channels: ['PUSH'] },
      { areaNames: {}, reach: null },
    );

    expect(rows.find((row) => row.label === 'Districts')?.value).toBe('—');
    expect(rows.find((row) => row.label === 'Channels')?.value).toBe(
      'Push notification (— people)',
    );
  });
});

describe('errorBanner', () => {
  it('counts the fields that need attention', () => {
    expect(errorBanner({})).toBeNull();
    expect(errorBanner({ message: 'Too short.' })).toEqual({
      title: '1 field needs attention',
      elsewhere: [],
    });
  });

  it('names fields that are on the warning level step', () => {
    expect(
      errorBanner({
        hazard: 'Choose.',
        severity: 'Choose.',
        channels: 'Pick.',
      }),
    ).toEqual({
      title: '3 fields need attention',
      elsewhere: ['Hazard type', 'Warning level'],
    });
  });
});

describe('PUBLISH_CHECKS', () => {
  it('has the four confirmations from the design', () => {
    expect(PUBLISH_CHECKS).toHaveLength(4);
  });
});

describe('publishReviewText', () => {
  const values = {
    ...EMPTY_FORM,
    hazard: 'other' as const,
    otherHazard: 'Dam breach',
    channels: ['SMS' as const],
  };

  it('asks to publish a new warning, with a draft option', async () => {
    const { publishReviewText } = await import('./publishing');

    expect(
      publishReviewText(values, { updatingId: null, areaNames: {}, reach }),
    ).toMatchObject({
      title: 'Publish this warning?',
      hazardLabel: 'Dam breach',
      confirmLabel: 'Confirm and publish',
      canSaveDraft: true,
    });
  });

  it('asks to send an update, without a draft option', async () => {
    const { publishReviewText } = await import('./publishing');

    expect(
      publishReviewText(values, {
        updatingId: '665f1b2c9d3e4a0012345670',
        areaNames: {},
        reach,
      }),
    ).toMatchObject({
      title: 'Send update to W-345670?',
      confirmLabel: 'Confirm and send update',
      canSaveDraft: false,
    });
  });
});
