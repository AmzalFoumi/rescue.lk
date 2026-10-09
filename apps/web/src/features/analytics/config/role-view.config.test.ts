import { describe, it, expect } from 'vitest';
import { TABS_BY_ROLE } from './role-view.config';

describe('role-view.config', () => {
  it('DMC_ADMIN sees shelters', () => {
    expect(TABS_BY_ROLE.DMC_ADMIN).toContain('shelters');
  });

  it('DONOR_ORGANISATION does not see shelters', () => {
    expect(TABS_BY_ROLE.DONOR_ORGANISATION).not.toContain('shelters');
  });
});
