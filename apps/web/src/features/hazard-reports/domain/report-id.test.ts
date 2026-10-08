import { describe, expect, it } from 'vitest';
import { shortReportId } from './report-id';

describe('shortReportId', () => {
  it('uses the last four characters in upper case', () => {
    expect(shortReportId('6ac71f73f776c0e7b5e78e36')).toBe('R-8E36');
  });

  it('keeps a very short id as it is', () => {
    expect(shortReportId('ab')).toBe('R-AB');
  });
});
