import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_VERIFIED_REPORTS } from '../warnings.constants.js';
import { MongooseHazardReportLookup } from './mongoose-hazard-report-lookup.repository.js';

const REPORT_ID = '665f1b2c9d3e4a00000000a1';
const DISTRICT_ID = '665f1b2c9d3e4a00000000d1';

// The shape of a hydrated UC2 document, as far as the adapter reads it.
const doc = (overrides: Record<string, unknown> = {}) => ({
  id: REPORT_ID,
  hazardType: 'flood',
  description: 'River overflowing near the bridge',
  placeName: 'Ratnapura town',
  reporterName: 'Nimal Perera',
  reporterId: 'citizen-nimal',
  district: { toString: () => DISTRICT_ID },
  status: 'verified',
  capturedAt: new Date('2026-10-08T01:00:00.000Z'),
  createdAt: new Date('2026-10-08T01:05:00.000Z'),
  verifiedAt: new Date('2026-10-08T01:30:00.000Z'),
  verifiedBy: 'operator-kj',
  ...overrides,
});

// A Mongoose query chain: find().sort().limit().exec() and findById().exec().
const chain = (result: unknown) => {
  const query = {
    sort: vi.fn(() => query),
    limit: vi.fn(() => query),
    select: vi.fn(() => query),
    exec: vi.fn().mockResolvedValue(result),
  };
  return query;
};

describe('MongooseHazardReportLookup', () => {
  let reports: {
    find: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
  };
  let districts: { find: ReturnType<typeof vi.fn> };
  let lookup: MongooseHazardReportLookup;

  beforeEach(() => {
    reports = { find: vi.fn(), findById: vi.fn() };
    districts = {
      find: vi.fn(() => chain([{ id: DISTRICT_ID, name: 'Ratnapura' }])),
    };
    lookup = new MongooseHazardReportLookup(
      reports as never,
      districts as never,
    );
  });

  describe('findVerified', () => {
    it('asks only for verified reports, newest first, with a cap', async () => {
      const query = chain([doc()]);
      reports.find.mockReturnValue(query);

      await lookup.findVerified();

      expect(reports.find).toHaveBeenCalledWith({ status: 'verified' });
      expect(query.sort).toHaveBeenCalledWith({ verifiedAt: -1 });
      expect(query.limit).toHaveBeenCalledWith(MAX_VERIFIED_REPORTS);
    });

    it('returns the reports in the UC1 shape with the district name', async () => {
      reports.find.mockReturnValue(chain([doc()]));

      await expect(lookup.findVerified()).resolves.toEqual([
        {
          id: REPORT_ID,
          hazardType: 'flood',
          district: DISTRICT_ID,
          districtName: 'Ratnapura',
          place: 'Ratnapura town',
          reporter: 'Nimal Perera',
          status: 'verified',
          description: 'River overflowing near the bridge',
          submittedAt: '2026-10-08T01:05:00.000Z',
          verifiedAt: '2026-10-08T01:30:00.000Z',
          verifiedBy: 'operator-kj',
        },
      ]);
    });

    it('reads every district name in one query', async () => {
      reports.find.mockReturnValue(
        chain([doc(), doc({ id: '665f1b2c9d3e4a00000000a2' })]),
      );

      await lookup.findVerified();

      expect(districts.find).toHaveBeenCalledTimes(1);
      expect(districts.find).toHaveBeenCalledWith({
        _id: { $in: [DISTRICT_ID] },
      });
    });

    it('skips the district query when there are no reports', async () => {
      reports.find.mockReturnValue(chain([]));

      await expect(lookup.findVerified()).resolves.toEqual([]);
      expect(districts.find).not.toHaveBeenCalled();
    });

    it('names an unknown district instead of failing', async () => {
      reports.find.mockReturnValue(chain([doc()]));
      districts.find.mockReturnValue(chain([]));

      const [report] = await lookup.findVerified();

      expect(report?.districtName).toBe('Unknown district');
    });

    it('leaves out a verified report without verification details', async () => {
      reports.find.mockReturnValue(chain([doc({ verifiedBy: undefined })]));

      await expect(lookup.findVerified()).resolves.toEqual([]);
    });
  });

  describe('findById', () => {
    it('returns a report of any status, so "not verified" can be reported', async () => {
      reports.findById.mockReturnValue(
        chain(
          doc({
            status: 'pending_verification',
            verifiedAt: undefined,
            verifiedBy: undefined,
          }),
        ),
      );

      const report = await lookup.findById(REPORT_ID);

      expect(reports.findById).toHaveBeenCalledWith(REPORT_ID);
      expect(report).toMatchObject({
        id: REPORT_ID,
        status: 'pending_verification',
        districtName: 'Ratnapura',
        verifiedAt: null,
        verifiedBy: null,
      });
    });

    it('returns null when the report does not exist', async () => {
      reports.findById.mockReturnValue(chain(null));

      await expect(lookup.findById(REPORT_ID)).resolves.toBeNull();
    });

    it.each(['abc', '', '665f1b2c9d3e4a00000000zz', '123456789012'])(
      'returns null for the malformed id "%s" without asking the database',
      async (id) => {
        await expect(lookup.findById(id)).resolves.toBeNull();
        expect(reports.findById).not.toHaveBeenCalled();
      },
    );
  });
});
