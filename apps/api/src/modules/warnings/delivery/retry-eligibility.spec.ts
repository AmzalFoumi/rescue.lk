import { describe, it, expect } from 'vitest';
import { retryRefusal } from './retry-eligibility.js';
import {
  buildDeliveryRecord,
  buildWarningRecord,
} from '../testing/warning.fixtures.js';

const failed = buildDeliveryRecord({ status: 'FAILED', warningVersion: 1 });
const active = buildWarningRecord({ status: 'ACTIVE', version: 1 });

describe('retryRefusal', () => {
  it('allows a FAILED delivery of the current version of an ACTIVE warning', () => {
    expect(retryRefusal(failed, active)).toBeNull();
  });

  it.each(['SENT', 'QUEUED', 'RETRYING'] as const)(
    'refuses a %s delivery',
    (status) => {
      expect(retryRefusal({ ...failed, status }, active)).toContain(
        `it is ${status}`,
      );
    },
  );

  it('refuses when the warning is no longer ACTIVE', () => {
    expect(retryRefusal(failed, { ...active, status: 'CANCELLED' })).toContain(
      'is CANCELLED',
    );
  });

  it('refuses a delivery from an older version', () => {
    expect(retryRefusal(failed, { ...active, version: 2 })).toContain(
      'version 1, but the warning is now version 2',
    );
  });
});
