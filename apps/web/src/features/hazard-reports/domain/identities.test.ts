import { describe, expect, it } from 'vitest';
import { DEMO_CITIZEN, DEMO_OPERATOR, displayName } from './identities';

describe('displayName', () => {
  it('shows the name of the demo operator', () => {
    expect(displayName(DEMO_OPERATOR.id)).toBe('K. Jayawardena');
  });

  it('shows the name of the demo citizen', () => {
    expect(displayName(DEMO_CITIZEN.id)).toBe('Nimal Perera');
  });

  it('shows any other id as it is', () => {
    expect(displayName('operator-9')).toBe('operator-9');
  });
});
