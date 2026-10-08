import type { ShelterDto } from '@rescue-lk/shared';

/**
 * The officer types how many people a shelter holds, but the API takes the
 * change, not the total. This works out the change and refuses anything the
 * shelter cannot take, so a full shelter is blocked before the request.
 */

export type OccupancyChange =
  { ok: true; people: number } | { ok: false; error: string };

export function occupancyChange(
  shelter: ShelterDto,
  nextOccupancy: number,
): OccupancyChange {
  if (!Number.isInteger(nextOccupancy)) {
    return { ok: false, error: 'Enter a whole number of people.' };
  }
  if (nextOccupancy < 0) {
    return { ok: false, error: 'A shelter cannot hold fewer than nobody.' };
  }
  if (nextOccupancy > shelter.capacity) {
    return {
      ok: false,
      error: `${shelter.name} holds ${shelter.capacity} people.`,
    };
  }
  const people = nextOccupancy - shelter.currentOccupancy;
  if (people === 0) {
    return { ok: false, error: 'That is the number it holds already.' };
  }
  return { ok: true, people };
}

/**
 * Sending evacuees to a shelter from the assign panel, where the officer gives
 * a number of arrivals rather than a new total.
 */
export function arrivalChange(
  shelter: ShelterDto,
  people: number,
): OccupancyChange {
  if (!Number.isInteger(people) || people < 1) {
    return { ok: false, error: 'Enter how many people are arriving.' };
  }
  if (shelter.status === 'full') {
    return {
      ok: false,
      error: `${shelter.name} is full. Choose another shelter.`,
    };
  }
  if (people > shelter.placesAvailable) {
    return {
      ok: false,
      error: `${shelter.name} has ${shelter.placesAvailable} places left.`,
    };
  }
  return { ok: true, people };
}
