import { describe, expect, it } from 'vitest';
import { describeDecision } from './decision-message';

const at = new Date('2026-10-07T10:42:00Z');

describe('describeDecision', () => {
  it('says who verified the report and when', () => {
    expect(
      describeDecision(
        'verified',
        '6ac71f73f776c0e7b5e78e36',
        'K. Jayawardena',
        at,
        'UTC',
      ),
    ).toBe('R-8E36 verified by K. Jayawardena at 10:42.');
  });

  it('says who rejected the report and when', () => {
    expect(
      describeDecision(
        'rejected',
        '6ac71f73f776c0e7b5e78e36',
        'K. Jayawardena',
        at,
        'UTC',
      ),
    ).toBe('R-8E36 rejected by K. Jayawardena at 10:42.');
  });
});
