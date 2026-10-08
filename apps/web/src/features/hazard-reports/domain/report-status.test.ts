import { describe, expect, it } from 'vitest';
import type { HazardReportStatus } from '@rescue-lk/shared';
import { STATUS_PRESENTATION, statusLabel } from './report-status';

describe('statusLabel', () => {
  it.each<[HazardReportStatus, string]>([
    ['pending_synchronisation', 'Pending Synchronisation'],
    ['pending_verification', 'Pending Verification'],
    ['verified', 'Verified'],
    ['rejected', 'Rejected'],
  ])('names %s as "%s"', (status, label) => {
    expect(statusLabel(status)).toBe(label);
  });
});

describe('STATUS_PRESENTATION', () => {
  it('gives every status its own tone, as in the design', () => {
    expect(STATUS_PRESENTATION.pending_synchronisation.tone).toBe('neutral');
    expect(STATUS_PRESENTATION.pending_verification.tone).toBe('caution');
    expect(STATUS_PRESENTATION.verified.tone).toBe('success');
    expect(STATUS_PRESENTATION.rejected.tone).toBe('danger');
  });
});
