import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { VerifiedHazardReportDto } from '@rescue-lk/shared';
import { Model } from 'mongoose';
import {
  District,
  DistrictDocument,
} from '../../../database/schemas/district.schema.js';
import { HazardReportStatus } from '../../hazard-reports/hazard-report-status.js';
import {
  HazardReport,
  HazardReportDocument,
} from '../../hazard-reports/schemas/hazard-report.schema.js';
import { MAX_VERIFIED_REPORTS } from '../warnings.constants.js';
import {
  StoredHazardReport,
  toHazardReportSummary,
  toVerifiedReport,
} from './hazard-report.mapper.js';
import type {
  HazardReportLookup,
  HazardReportSummary,
} from './hazard-report-lookup.interface.js';

// Ids are 24-character hex strings (MongoDB ObjectIds). Checking the shape keeps an
// id that cannot exist out of the database: it is a plain "not found", not a crash.
const OBJECT_ID_FORMAT = /^[0-9a-f]{24}$/i;
const isObjectId = (id: string): boolean => OBJECT_ID_FORMAT.test(id);

/**
 * Reads hazard reports from UC2 for the warnings use case.
 * Adapter for the HazardReportLookup port (DIP): the services depend on the port,
 * never on this class. Like the response module, it only reads UC2's schema and does
 * not import UC2's services or module.
 */
@Injectable()
export class MongooseHazardReportLookup implements HazardReportLookup {
  constructor(
    @InjectModel(HazardReport.name)
    private readonly reports: Model<HazardReportDocument>,
    @InjectModel(District.name)
    private readonly districts: Model<DistrictDocument>,
  ) {}

  async findById(id: string): Promise<HazardReportSummary | null> {
    if (!isObjectId(id)) {
      return null;
    }
    const doc = await this.reports.findById(id).exec();
    if (!doc) {
      return null;
    }
    const [summary] = await this.summarise([doc]);
    return summary ?? null;
  }

  async findVerified(): Promise<VerifiedHazardReportDto[]> {
    const docs = await this.reports
      .find({ status: HazardReportStatus.Verified })
      .sort({ verifiedAt: -1 })
      .limit(MAX_VERIFIED_REPORTS)
      .exec();
    const summaries = await this.summarise(docs);
    return summaries
      .map(toVerifiedReport)
      .filter((report): report is VerifiedHazardReportDto => report !== null);
  }

  // One district query for the whole list, not one per report.
  private async summarise(
    docs: HazardReportDocument[],
  ): Promise<HazardReportSummary[]> {
    const names = await this.districtNames(docs);
    return docs.map((doc) =>
      toHazardReportSummary(
        this.toStored(doc),
        names.get(String(doc.district)),
      ),
    );
  }

  private async districtNames(
    docs: HazardReportDocument[],
  ): Promise<Map<string, string>> {
    const ids = [...new Set(docs.map((doc) => String(doc.district)))].filter(
      isObjectId,
    );
    if (ids.length === 0) {
      return new Map();
    }
    const found = await this.districts
      .find({ _id: { $in: ids } })
      .select('name')
      .exec();
    return new Map(found.map((district) => [district.id, district.name]));
  }

  private toStored(doc: HazardReportDocument): StoredHazardReport {
    return {
      id: doc.id,
      hazardType: doc.hazardType,
      description: doc.description,
      placeName: doc.placeName,
      reporterName: doc.reporterName,
      reporterId: doc.reporterId,
      district: String(doc.district),
      status: doc.status,
      capturedAt: doc.capturedAt,
      createdAt: doc.createdAt,
      verifiedAt: doc.verifiedAt,
      verifiedBy: doc.verifiedBy,
    };
  }
}
