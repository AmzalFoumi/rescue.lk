import { describe, beforeEach, it, expect } from 'vitest';
import { isMongoId } from 'class-validator';
import { InMemoryHazardReportLookup } from './in-memory-hazard-report-lookup.js';

const VERIFIED_REPORT_COUNT = 3;
const UNKNOWN_ID = '000000000000000000000000';

describe('InMemoryHazardReportLookup', () => {
  let lookup: InMemoryHazardReportLookup;

  beforeEach(() => {
    lookup = new InMemoryHazardReportLookup();
  });

  it('findVerified returns only verified reports', async () => {
    const reports = await lookup.findVerified();

    expect(reports).toHaveLength(VERIFIED_REPORT_COUNT);
    expect(reports.every((report) => report.status === 'verified')).toBe(true);
  });

  it('uses ids that pass the IssueWarningDto MongoId validation', async () => {
    const reports = await lookup.findVerified();

    for (const report of reports) {
      expect(isMongoId(report.id)).toBe(true);
      expect(isMongoId(report.district)).toBe(true);
    }
  });

  it('findById returns a verified report', async () => {
    const [verified] = await lookup.findVerified();

    await expect(lookup.findById(verified.id)).resolves.toEqual(verified);
  });

  it('findById also returns non-verified reports so callers can reject them', async () => {
    const verifiedIds = (await lookup.findVerified()).map(
      (report) => report.id,
    );
    const pendingId = '665f1b2c9d3e4a00000000a4';

    expect(verifiedIds).not.toContain(pendingId);
    await expect(lookup.findById(pendingId)).resolves.toMatchObject({
      id: pendingId,
      status: 'pending',
    });
  });

  it('findById returns null for an unknown id', async () => {
    await expect(lookup.findById(UNKNOWN_ID)).resolves.toBeNull();
  });
});
