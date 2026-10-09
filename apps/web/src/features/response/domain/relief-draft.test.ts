import { describe, it, expect } from 'vitest';
import {
  ARMY_OWNER,
  NGO_OWNER,
  sampleShelter,
  sampleTeam,
} from '../testing/test-support';
import {
  buildReliefRequest,
  EMPTY_RELIEF_DRAFT,
  ownersFrom,
  validateReliefDraft,
  type ReliefDraft,
} from './relief-draft';

const ready: ReliefDraft = {
  item: 'water',
  quantity: '500',
  district: 'd-kan',
  organisationId: NGO_OWNER.organisationId,
};

describe('validateReliefDraft', () => {
  it('finds nothing wrong with a filled form', () => {
    expect(validateReliefDraft(ready)).toEqual({});
  });

  it('names every missing field on an empty form', () => {
    expect(Object.keys(validateReliefDraft(EMPTY_RELIEF_DRAFT))).toEqual([
      'item',
      'quantity',
      'district',
      'organisationId',
    ]);
  });

  it('refuses a quantity of zero or less', () => {
    expect(
      validateReliefDraft({ ...ready, quantity: '0' }).quantity,
    ).toBeDefined();
    expect(
      validateReliefDraft({ ...ready, quantity: '-5' }).quantity,
    ).toBeDefined();
  });

  it('refuses a quantity that is not a whole number', () => {
    expect(
      validateReliefDraft({ ...ready, quantity: '2.5' }).quantity,
    ).toBeDefined();
  });

  it('accepts a single unit', () => {
    expect(validateReliefDraft({ ...ready, quantity: '1' })).toEqual({});
  });
});

describe('buildReliefRequest', () => {
  const owners = [ARMY_OWNER, NGO_OWNER];

  it('builds the body from a ready form', () => {
    expect(buildReliefRequest(ready, owners)).toEqual({
      item: 'water',
      quantity: 500,
      district: 'd-kan',
      owner: NGO_OWNER,
    });
  });

  it('refuses to build anything from a form that is not ready', () => {
    expect(buildReliefRequest(EMPTY_RELIEF_DRAFT, owners)).toBeNull();
  });

  it('refuses an organisation it does not know', () => {
    expect(
      buildReliefRequest({ ...ready, organisationId: 'org-nope' }, owners),
    ).toBeNull();
  });
});

describe('ownersFrom', () => {
  it('lists each organisation once, in name order', () => {
    const owners = ownersFrom([
      sampleTeam(),
      sampleTeam({ id: 't2' }),
      sampleShelter(),
    ]);

    expect(owners.map((owner) => owner.name)).toEqual([
      'Sri Lanka Army',
      'Sri Lanka Red Cross',
    ]);
  });

  it('is empty when there is nothing to take owners from', () => {
    expect(ownersFrom([])).toEqual([]);
  });
});
