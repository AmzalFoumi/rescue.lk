import {
  Ban,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CircleX,
  Clock,
  Construction,
  Flame,
  Info,
  MessageSquareText,
  Mountain,
  OctagonAlert,
  PencilLine,
  RadioTower,
  RefreshCw,
  Siren,
  Smartphone,
  TriangleAlert,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import type {
  AlertChannelType,
  DeliveryStatus,
  HazardType,
  WarningSeverity,
  WarningStatus,
} from '@rescue-lk/shared';

// Display data for the shared vocabulary: a readable label, an icon and a
// colour tone. Status is always shown as icon + text, never by colour alone.

export type Tone = 'red' | 'orange' | 'amber' | 'blue' | 'green' | 'gray';

export interface DisplayMeta {
  label: string;
  icon: LucideIcon;
}

export interface TonedMeta extends DisplayMeta {
  tone: Tone;
}

// Text, background and border colours of each tone (from the UC1 design).
export const TONE_CLASSES: Record<Tone, string> = {
  red: 'text-[#9F1D1D] bg-[#FCEDED] border-[#EFC4C4]',
  orange: 'text-[#A3420E] bg-[#FDF1E7] border-[#F1CDB2]',
  amber: 'text-[#7A5300] bg-[#FAF3DF] border-[#E8D49C]',
  blue: 'text-[#1C4E8C] bg-[#E9F0F9] border-[#BFD2EC]',
  green: 'text-[#1B6A3B] bg-[#E7F3EC] border-[#B6D9C3]',
  gray: 'text-[#46525F] bg-[#EEF1F4] border-[#D3D9E0]',
};

// Ordered from most to least severe.
export const SEVERITY_META: Record<
  WarningSeverity,
  TonedMeta & { hint: string }
> = {
  CRITICAL: {
    label: 'Critical',
    icon: OctagonAlert,
    tone: 'red',
    hint: 'Immediate threat to life. Evacuate.',
  },
  HIGH: {
    label: 'High',
    icon: TriangleAlert,
    tone: 'orange',
    hint: 'Serious danger expected within hours.',
  },
  MEDIUM: {
    label: 'Medium',
    icon: CircleAlert,
    tone: 'amber',
    hint: 'Be prepared to act.',
  },
  LOW: { label: 'Low', icon: Info, tone: 'blue', hint: 'Stay informed.' },
};

export const WARNING_STATUS_META: Record<WarningStatus, TonedMeta> = {
  DRAFT: { label: 'Draft', icon: PencilLine, tone: 'blue' },
  ACTIVE: { label: 'Active', icon: RadioTower, tone: 'green' },
  CANCELLED: { label: 'Cancelled', icon: Ban, tone: 'gray' },
};

export const DELIVERY_STATUS_META: Record<DeliveryStatus, TonedMeta> = {
  QUEUED: { label: 'Queued', icon: Clock, tone: 'gray' },
  SENT: { label: 'Sent', icon: CircleCheck, tone: 'green' },
  RETRYING: { label: 'Retrying', icon: RefreshCw, tone: 'amber' },
  FAILED: { label: 'Failed', icon: CircleX, tone: 'red' },
};

// Status of a source report; UC1 only ever works with verified ones.
export const VERIFIED_REPORT_META: TonedMeta = {
  label: 'Verified',
  icon: CircleCheck,
  tone: 'green',
};

export const HAZARD_META: Record<HazardType, DisplayMeta> = {
  FLOOD: { label: 'Flood', icon: Waves },
  LANDSLIDE: { label: 'Landslide', icon: Mountain },
  ROAD_BLOCKAGE: { label: 'Road Blockage', icon: Construction },
  FIRE: { label: 'Fire', icon: Flame },
  OTHER: { label: 'Other', icon: CircleHelp },
};

export const CHANNEL_META: Record<
  AlertChannelType,
  DisplayMeta & { hint: string; short: string }
> = {
  SMS: {
    label: 'SMS',
    short: 'SMS',
    icon: MessageSquareText,
    hint: 'Cell broadcast to mobile numbers in the area',
  },
  PUSH: {
    label: 'Push notification',
    short: 'Push',
    icon: Smartphone,
    hint: 'rescue.lk app users in the area',
  },
  SIREN: {
    label: 'Public siren',
    short: 'Siren',
    icon: Siren,
    hint: 'Tsunami and flood siren towers',
  },
};

export const SEVERITIES = Object.keys(SEVERITY_META) as WarningSeverity[];
export const HAZARDS = Object.keys(HAZARD_META) as HazardType[];
export const CHANNELS = Object.keys(CHANNEL_META) as AlertChannelType[];
export const WARNING_STATUSES = Object.keys(
  WARNING_STATUS_META,
) as WarningStatus[];
