import type {
  AlertChannelType,
  ReachEstimateDto,
  WarningFormErrors,
  WarningFormField,
} from '@rescue-lk/shared';
import { SMS_PART_LENGTH, SMS_SINGLE_LENGTH } from './constants';
import type { WarningFormValues } from './form';
import { areaSummary, formatCount, hazardName, shortId } from './format';
import { CHANNEL_META } from './meta';

const UNKNOWN = '—';

// publishing.ts: the pure rules behind publishing: SMS length, reach per channel, the
// error banner and the confirmation dialog text.
// SRP: kept out of components, so they are unit tested without rendering.
// The four checklist items are data (PUBLISH_CHECKS), so a new check is one entry.

// The design's four confirmations before a warning goes out.
export const PUBLISH_CHECKS = [
  {
    id: 'source',
    label: 'The source report is verified and describes the current situation.',
  },
  { id: 'area', label: 'The target area covers only the places at risk.' },
  {
    id: 'message',
    label:
      'The message and safety instructions have been read back and are accurate.',
  },
  { id: 'channels', label: 'The selected channels suit this severity.' },
] as const;

// "212 characters · sent as 2 SMS parts".
export const messageCountLabel = (message: string): string => {
  const length = message.length;
  const parts =
    length > SMS_SINGLE_LENGTH ? Math.ceil(length / SMS_PART_LENGTH) : 1;
  return parts > 1
    ? `${length} characters · sent as ${parts} SMS parts`
    : `${length} characters`;
};

export const reachFor = (
  reach: ReachEstimateDto | null,
  channel: AlertChannelType,
): number | null =>
  reach?.channels.find((entry) => entry.channel === channel)?.recipients ??
  null;

// "SMS (240,000 people)" or "Public siren (16 sirens)".
const channelReach = (
  channel: AlertChannelType,
  reach: ReachEstimateDto | null,
) => {
  const count = reachFor(reach, channel);
  const unit = channel === 'SIREN' ? 'sirens' : 'people';
  return `${CHANNEL_META[channel].label} (${count === null ? UNKNOWN : formatCount(count)} ${unit})`;
};

export interface SummaryRow {
  label: string;
  value: string;
}

// What the publish confirmation lists before the warning goes out.
export const publishSummary = (
  values: WarningFormValues,
  {
    areaNames,
    reach,
  }: { areaNames: Record<string, string>; reach: ReachEstimateDto | null },
): SummaryRow[] => [
  { label: 'Source report', value: shortId('R', values.sourceReportId) },
  { label: 'Target area', value: areaSummary(values.areaIds, areaNames) },
  { label: 'Districts', value: reach?.districts.join(', ') || UNKNOWN },
  {
    label: 'Channels',
    value: values.channels
      .map((channel) => channelReach(channel, reach))
      .join(', '),
  },
  { label: 'Message', value: values.message },
  {
    label: 'Safety instructions',
    value: values.instructions
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join(' · '),
  },
];

// Fields edited on step 3, named in the step 4 banner so they can be found.
const LEVEL_STEP_FIELDS: Partial<Record<WarningFormField, string>> = {
  sourceReportId: 'Source report',
  hazard: 'Hazard type',
  otherHazard: 'Name of hazard',
  severity: 'Warning level',
};

export interface ErrorBanner {
  title: string;
  // Labels of invalid fields that are on the warning level step.
  elsewhere: string[];
}

export const errorBanner = (errors: WarningFormErrors): ErrorBanner | null => {
  const fields = Object.keys(errors) as WarningFormField[];
  if (fields.length === 0) {
    return null;
  }
  const count = fields.length;
  return {
    title: `${count} ${count === 1 ? 'field needs' : 'fields need'} attention`,
    elsewhere: fields.flatMap((field) => {
      const label = LEVEL_STEP_FIELDS[field];
      return label ? [label] : [];
    }),
  };
};

export interface PublishReviewText {
  title: string;
  hazardLabel: string;
  summary: SummaryRow[];
  confirmLabel: string;
  // An update of an ACTIVE warning cannot be saved back as a draft.
  canSaveDraft: boolean;
}

// Everything the publish confirmation says, for a new warning or an update.
export const publishReviewText = (
  values: WarningFormValues,
  {
    updatingId,
    areaNames,
    reach,
  }: {
    // The ACTIVE warning being updated, or null for a new warning or draft.
    updatingId: string | null;
    areaNames: Record<string, string>;
    reach: ReachEstimateDto | null;
  },
): PublishReviewText => ({
  title: updatingId
    ? `Send update to ${shortId('W', updatingId)}?`
    : 'Publish this warning?',
  hazardLabel: values.hazard
    ? hazardName({ hazard: values.hazard, otherHazard: values.otherHazard })
    : '',
  summary: publishSummary(values, { areaNames, reach }),
  confirmLabel: updatingId ? 'Confirm and send update' : 'Confirm and publish',
  canSaveDraft: !updatingId,
});
