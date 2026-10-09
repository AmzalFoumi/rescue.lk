import { describe, it, expect } from 'vitest';
import { shelter } from './response.test-data.js';
import { ShelterStatus, shelterStatus, toShelterView } from './shelter.js';

describe('shelterStatus', () => {
  it('is Available well below capacity', () => {
    expect(
      shelterStatus(shelter({ capacity: 100, currentOccupancy: 50 })),
    ).toBe(ShelterStatus.Available);
  });

  it('is Nearly Full from four fifths of capacity', () => {
    expect(
      shelterStatus(shelter({ capacity: 100, currentOccupancy: 80 })),
    ).toBe(ShelterStatus.NearlyFull);
  });

  it('is Full once every place is taken', () => {
    expect(
      shelterStatus(shelter({ capacity: 100, currentOccupancy: 100 })),
    ).toBe(ShelterStatus.Full);
  });

  it('stays Full if the count somehow passes the capacity', () => {
    expect(
      shelterStatus(shelter({ capacity: 100, currentOccupancy: 120 })),
    ).toBe(ShelterStatus.Full);
  });

  it('is Available when the shelter is empty', () => {
    expect(shelterStatus(shelter({ capacity: 100, currentOccupancy: 0 }))).toBe(
      ShelterStatus.Available,
    );
  });
});

describe('toShelterView', () => {
  it('adds the status and the places left to the record', () => {
    const view = toShelterView(
      shelter({ capacity: 400, currentOccupancy: 320 }),
    );

    expect(view.status).toBe(ShelterStatus.NearlyFull);
    expect(view.placesAvailable).toBe(80);
  });

  it('never reports a negative number of places', () => {
    const view = toShelterView(
      shelter({ capacity: 100, currentOccupancy: 120 }),
    );

    expect(view.placesAvailable).toBe(0);
  });
});
