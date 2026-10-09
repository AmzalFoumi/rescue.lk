import { describe, it, expect } from 'vitest';
import { DEMO_OFFICER, officerName } from './identities';

describe('officerName', () => {
  it('names the demo officer', () => {
    expect(officerName(DEMO_OFFICER.id)).toBe('S. Perera');
  });

  it('shows an unknown id as it is', () => {
    expect(officerName('officer-unknown')).toBe('officer-unknown');
  });
});
