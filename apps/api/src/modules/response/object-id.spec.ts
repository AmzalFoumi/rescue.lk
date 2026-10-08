import { describe, it, expect } from 'vitest';
import { isObjectId } from './object-id.js';

describe('isObjectId', () => {
  it('accepts a 24-character hex string in either case', () => {
    expect(isObjectId('6ac71f73f776c0e7b5e78e36')).toBe(true);
    expect(isObjectId('6AC71F73F776C0E7B5E78E36')).toBe(true);
  });

  it('rejects anything shorter, longer or not hex', () => {
    expect(isObjectId('6ac71f73f776c0e7b5e78e3')).toBe(false);
    expect(isObjectId('6ac71f73f776c0e7b5e78e366')).toBe(false);
    expect(isObjectId('zzc71f73f776c0e7b5e78e36')).toBe(false);
    expect(isObjectId('')).toBe(false);
  });
});
