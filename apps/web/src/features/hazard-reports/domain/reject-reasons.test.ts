import { describe, expect, it } from 'vitest';
import {
  MAX_REJECTION_LENGTH,
  REJECTION_MESSAGES,
  composeRejectionReason,
  validateRejection,
} from './reject-reasons';

describe('composeRejectionReason', () => {
  it('uses only the label when there is no note', () => {
    expect(composeRejectionReason('not_a_hazard', '')).toBe('Not a hazard');
  });

  it('adds the note after the label', () => {
    expect(
      composeRejectionReason('insufficient_information', ' No photo '),
    ).toBe('Insufficient information: No photo');
  });

  it('uses only the note for "other"', () => {
    expect(composeRejectionReason('other', 'Test report')).toBe('Test report');
  });
});

describe('validateRejection', () => {
  it('asks for a reason when none is chosen', () => {
    expect(validateRejection('', '')).toBe(REJECTION_MESSAGES.chooseReason);
  });

  it('asks for details when the reason is "other"', () => {
    expect(validateRejection('other', '  ')).toBe(
      REJECTION_MESSAGES.describeOther,
    );
  });

  it('accepts a chosen reason without a note', () => {
    expect(validateRejection('duplicate', '')).toBeNull();
  });

  it('accepts "other" with a note', () => {
    expect(validateRejection('other', 'Not related to a hazard')).toBeNull();
  });

  it('accepts a note up to the limit and rejects one over it', () => {
    const atLimit = 'a'.repeat(MAX_REJECTION_LENGTH);
    expect(validateRejection('other', atLimit)).toBeNull();
    expect(validateRejection('other', `${atLimit}a`)).toBe(
      REJECTION_MESSAGES.tooLong,
    );
  });
});
