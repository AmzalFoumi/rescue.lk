import type { Owner } from './organisation.js';

/** A shelter is Nearly Full once this share of its places is taken. */
export const NEARLY_FULL_RATIO = 0.8;

export enum ShelterStatus {
  Available = 'available',
  NearlyFull = 'nearly_full',
  Full = 'full',
}

/** A shelter, as the services see it. Occupancy is counted against capacity. */
export interface ShelterRecord {
  id: string;
  name: string;
  owner: Owner;
  /** District id. */
  district: string;
  capacity: number;
  currentOccupancy: number;
}

/** A shelter with the numbers the officer reads, all derived from the record. */
export interface ShelterView extends ShelterRecord {
  status: ShelterStatus;
  placesAvailable: number;
}

/**
 * The status is never stored: it is worked out from occupancy and capacity, so
 * the list, the totals and the status chip can never disagree.
 */
export function shelterStatus(shelter: ShelterRecord): ShelterStatus {
  if (shelter.currentOccupancy >= shelter.capacity) {
    return ShelterStatus.Full;
  }
  if (shelter.currentOccupancy >= shelter.capacity * NEARLY_FULL_RATIO) {
    return ShelterStatus.NearlyFull;
  }
  return ShelterStatus.Available;
}

export function toShelterView(shelter: ShelterRecord): ShelterView {
  return {
    ...shelter,
    status: shelterStatus(shelter),
    placesAvailable: Math.max(0, shelter.capacity - shelter.currentOccupancy),
  };
}
