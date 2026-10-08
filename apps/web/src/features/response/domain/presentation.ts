import type {
  HazardType,
  OrganisationKind,
  ReliefItem,
  ShelterStatus,
  TeamStatus,
} from '@rescue-lk/shared';

/**
 * How each coded value is shown. Colour is always paired with a label and an
 * icon, so a status never depends on colour alone.
 */

export type Tone = 'neutral' | 'info' | 'caution' | 'success' | 'danger';

export type IconName =
  | 'waves'
  | 'mountain'
  | 'construction'
  | 'flame'
  | 'circle-help'
  | 'circle-check'
  | 'truck'
  | 'rotate-ccw'
  | 'circle-slash'
  | 'house'
  | 'triangle-alert'
  | 'ban';

export interface Presentation {
  label: string;
  tone: Tone;
  icon: IconName;
}

export const HAZARD_PRESENTATION: Record<HazardType, Presentation> = {
  flood: { label: 'Flood', tone: 'info', icon: 'waves' },
  landslide: { label: 'Landslide', tone: 'caution', icon: 'mountain' },
  road_blockage: {
    label: 'Road blockage',
    tone: 'neutral',
    icon: 'construction',
  },
  fire: { label: 'Fire', tone: 'danger', icon: 'flame' },
  other: { label: 'Other', tone: 'neutral', icon: 'circle-help' },
};

export const TEAM_STATUS_PRESENTATION: Record<TeamStatus, Presentation> = {
  available: { label: 'Available', tone: 'success', icon: 'circle-check' },
  dispatched: { label: 'Dispatched', tone: 'info', icon: 'truck' },
  returning: { label: 'Returning', tone: 'caution', icon: 'rotate-ccw' },
  unavailable: {
    label: 'Unavailable',
    tone: 'neutral',
    icon: 'circle-slash',
  },
};

export const SHELTER_STATUS_PRESENTATION: Record<ShelterStatus, Presentation> =
  {
    available: { label: 'Available', tone: 'success', icon: 'house' },
    nearly_full: {
      label: 'Nearly full',
      tone: 'caution',
      icon: 'triangle-alert',
    },
    full: { label: 'Full', tone: 'danger', icon: 'ban' },
  };

export const ORGANISATION_KIND_LABELS: Record<OrganisationKind, string> = {
  government: 'Government',
  armed_forces: 'Armed forces',
  ngo: 'NGO',
  private_donor: 'Private donor',
};

export const RELIEF_ITEM_LABELS: Record<ReliefItem, string> = {
  food: 'Food',
  water: 'Water',
  medicine: 'Medicine',
  other: 'Other',
};

/**
 * The status changes a team may be given by hand. Dispatching is missing on
 * purpose: that happens through Dispatch Rescue Team, never from this menu.
 */
export const MANUAL_TEAM_STATUS_CHANGES: Record<TeamStatus, TeamStatus[]> = {
  available: ['unavailable'],
  dispatched: ['returning', 'unavailable'],
  returning: ['available', 'unavailable'],
  unavailable: ['available'],
};
