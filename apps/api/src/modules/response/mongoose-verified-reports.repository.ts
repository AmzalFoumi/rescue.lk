import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HazardReportStatus } from '../hazard-reports/hazard-report-status.js';
import {
  HazardReport,
  HazardReportDocument,
} from '../hazard-reports/schemas/hazard-report.schema.js';
import type { VerifiedReportSummary } from './verified-report.js';
import type { VerifiedReportsPort } from './verified-reports.port.js';

/**
 * Reads verified hazard reports for response coordination. This is the only
 * file here that knows anything about the hazard reports module: it turns
 * their documents into our own small view, so nothing else is coupled to them.
 */
@Injectable()
export class MongooseVerifiedReportsRepository implements VerifiedReportsPort {
  constructor(
    @InjectModel(HazardReport.name)
    private readonly model: Model<HazardReportDocument>,
  ) {}

  async findVerified(): Promise<VerifiedReportSummary[]> {
    const docs = await this.model
      .find({ status: HazardReportStatus.Verified })
      .sort({ capturedAt: -1 })
      .exec();
    return docs.map((doc) => this.toSummary(doc));
  }

  async findVerifiedById(id: string): Promise<VerifiedReportSummary | null> {
    const doc = await this.model
      .findOne({ _id: id, status: HazardReportStatus.Verified })
      .exec();
    return doc ? this.toSummary(doc) : null;
  }

  private toSummary(doc: HazardReportDocument): VerifiedReportSummary {
    return {
      id: doc.id,
      hazardType: doc.hazardType,
      description: doc.description,
      district: String(doc.district),
      location: {
        latitude: doc.location.latitude,
        longitude: doc.location.longitude,
      },
      capturedAt: doc.capturedAt,
    };
  }
}
