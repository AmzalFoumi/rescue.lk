import { describe, it, expect } from 'vitest';
import { sampleShelter } from '../testing/test-support';
import { arrivalChange, occupancyChange } from './occupancy-change';

describe('occupancyChange', () => {
  const shelter = sampleShelter({ capacity: 400, currentOccupancy: 100 });

  it('works out how many people arrived', () => {
    expect(occupancyChange(shelter, 125)).toEqual({ ok: true, people: 25 });
  });

  it('works out how many people left', () => {
    expect(occupancyChange(shelter, 80)).toEqual({ ok: true, people: -20 });
  });

  it('allows the shelter to be filled exactly', () => {
    expect(occupancyChange(shelter, 400)).toEqual({ ok: true, people: 300 });
  });

  it('refuses more people than the shelter holds', () => {
    const result = occupancyChange(shelter, 401);
    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ error: expect.stringContaining('400') });
  });

  it('refuses a negative number', () => {
    expect(occupancyChange(shelter, -1).ok).toBe(false);
  });

  it('refuses a number that is not whole', () => {
    expect(occupancyChange(shelter, 12.5).ok).toBe(false);
  });

  it('refuses the number it already holds, so nothing is sent', () => {
    expect(occupancyChange(shelter, 100)).toMatchObject({ ok: false });
  });
});

describe('arrivalChange', () => {
  it('passes the number of arrivals through', () => {
    expect(arrivalChange(sampleShelter(), 25)).toEqual({
      ok: true,
      people: 25,
    });
  });

  it('blocks anyone being sent to a full shelter', () => {
    const full = sampleShelter({ status: 'full', placesAvailable: 0 });
    const result = arrivalChange(full, 1);
    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ error: expect.stringContaining('full') });
  });

  it('blocks more people than there are places left', () => {
    const nearly = sampleShelter({
      status: 'nearly_full',
      placesAvailable: 20,
    });
    expect(arrivalChange(nearly, 21)).toMatchObject({ ok: false });
    expect(arrivalChange(nearly, 20)).toMatchObject({ ok: true });
  });

  it('refuses nobody and refuses a part of a person', () => {
    expect(arrivalChange(sampleShelter(), 0).ok).toBe(false);
    expect(arrivalChange(sampleShelter(), 2.5).ok).toBe(false);
  });
});
