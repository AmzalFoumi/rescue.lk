import type {
  AlertChannelType,
  DeliveryRecordDto,
  DeliveryStatus,
  ReachEstimateDto,
  TargetAreaDto,
  WarningDto,
} from '@rescue-lk/shared';
import { areaSummary, formatCount } from './format';
import { resolveDistricts } from './monitoring';
import { CHANNEL_META, DELIVERY_STATUS_META } from './meta';
import { reachFor } from './publishing';
import { newestFirst, warningEvents, type TimelineEvent } from './timeline';

// delivery.ts: the pure rules behind step 5 "Delivery status": KPIs, labels, the audit
// timeline and the whole step view.
// SRP: kept out of components, so they are unit tested without rendering and the
// components only display the result.
// Sirens reach towers, not people, so they are left out of people counts.

// Sirens reach towers, not people, so they are left out of people counts.
const reachesPeople = (channel: AlertChannelType) => channel !== 'SIREN';

const PERCENT_DECIMALS = 1;
const PERCENT = 100;

export interface DeliveryKpis {
  target: number;
  delivered: number;
  pending: number;
  failed: number;
}

const IN_PROGRESS: readonly DeliveryStatus[] = ['QUEUED', 'RETRYING'];

// Citizens targeted and how many were reached, are pending or failed, using
// the expected reach of each people channel (SMS and push).
export const deliveryKpis = (
  records: readonly DeliveryRecordDto[],
  channels: readonly AlertChannelType[],
  reach: ReachEstimateDto | null,
): DeliveryKpis => {
  const people = (channel: AlertChannelType) =>
    reachesPeople(channel) ? (reachFor(reach, channel) ?? 0) : 0;
  const sum = (statuses: readonly DeliveryStatus[]) =>
    records
      .filter((record) => statuses.includes(record.status))
      .reduce((total, record) => total + people(record.channel), 0);
  return {
    target: channels.reduce((total, channel) => total + people(channel), 0),
    delivered: sum(['SENT']),
    pending: sum(IN_PROGRESS),
    failed: sum(['FAILED']),
  };
};

// " (33.3%)" of the target, or nothing when there is no target.
export const percentLabel = (value: number, target: number): string =>
  target ? ` (${((value / target) * PERCENT).toFixed(PERCENT_DECIMALS)}%)` : '';

// "240,000 people" or "16 sirens" once sent; a dash before.
export const recipientsLabel = (record: DeliveryRecordDto): string => {
  if (record.status !== 'SENT') {
    return '–';
  }
  const unit = reachesPeople(record.channel) ? 'people' : 'sirens';
  return `${formatCount(record.recipients)} ${unit}`;
};

const attemptsText = (attempts: number) =>
  `${attempts} attempt${attempts === 1 ? '' : 's'}`;

// The final result of each channel: "SMS: Sent after 2 attempts, 240,000 people."
const deliveryEvents = (
  records: readonly DeliveryRecordDto[],
): TimelineEvent[] =>
  records.flatMap((record) => {
    if (!record.lastAttemptAt || IN_PROGRESS.includes(record.status)) {
      return [];
    }
    const sent = record.status === 'SENT';
    const result = `${CHANNEL_META[record.channel].label}: ${DELIVERY_STATUS_META[record.status].label} after ${attemptsText(record.attempts)}`;
    return [
      {
        at: record.lastAttemptAt,
        kind: sent ? 'sent' : 'failed',
        text: sent ? `${result}, ${recipientsLabel(record)}.` : `${result}.`,
      },
    ];
  });

// Step 5 audit timeline: the warning's history and each channel's result.
export const auditTimeline = (
  warning: WarningDto,
  records: readonly DeliveryRecordDto[],
  areaNames: Record<string, string>,
): TimelineEvent[] =>
  newestFirst([
    ...warningEvents(warning, areaNames),
    ...deliveryEvents(records),
  ]);

export interface DeliveryView {
  warning: WarningDto;
  records: readonly DeliveryRecordDto[];
  kpis: DeliveryKpis;
  timeline: readonly TimelineEvent[];
  // "Kalu Ganga basin · Ratnapura, Kalutara · version 1".
  subtitle: string;
}

interface DeliveryData {
  warnings: readonly WarningDto[];
  records: readonly DeliveryRecordDto[];
  reach: ReachEstimateDto | null;
  areas: readonly TargetAreaDto[];
}

// Everything step 5 shows about one warning; null until it is loaded.
export const buildDeliveryView = (
  warningId: string | null,
  { warnings, records, reach, areas }: DeliveryData,
): DeliveryView | null => {
  const warning = warnings.find((candidate) => candidate.id === warningId);
  if (!warning) {
    return null;
  }
  const areaNames = Object.fromEntries(
    areas.map((area) => [area.id, area.name]),
  );
  return {
    warning,
    records,
    kpis: deliveryKpis(records, warning.channels, reach),
    timeline: auditTimeline(warning, records, areaNames),
    subtitle: [
      areaSummary(warning.areaIds, areaNames),
      resolveDistricts(warning.areaIds, areas).join(', '),
      `version ${warning.version}`,
    ]
      .filter(Boolean)
      .join(' · '),
  };
};
