import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  HazardReport,
  HazardReportDocument,
} from './schemas/hazard-report.schema.js';
import type {
  HazardReportsRepository,
  NewHazardReport,
  StatusChange,
} from './hazard-reports.repository.interface.js';
import type { HazardReportRecord } from './hazard-report-record.js';
import type { HazardReportStatus } from './hazard-report-status.js';
import type { HazardType } from './hazard-type.js';

/** The only class that talks to MongoDB for hazard reports. */
@Injectable()
export class MongooseHazardReportsRepository implements HazardReportsRepository {
  constructor(
    @InjectModel(HazardReport.name)
    private readonly model: Model<HazardReportDocument>,
  ) {}

  async create(report: NewHazardReport): Promise<HazardReportRecord> {
    return this.toRecord(await this.model.create(report));
  }

  async findById(id: string): Promise<HazardReportRecord | null> {
    const doc = await this.model.findById(id).exec();
    return doc ? this.toRecord(doc) : null;
  }

  async findByStatus(
    status: HazardReportStatus,
  ): Promise<HazardReportRecord[]> {
    const docs = await this.model
      .find({ status })
      .sort({ capturedAt: 1 })
      .exec();
    return docs.map((doc) => this.toRecord(doc));
  }

  async findByTypeBetween(
    type: HazardType,
    from: Date,
    to: Date,
  ): Promise<HazardReportRecord[]> {
    const docs = await this.model
      .find({ hazardType: type, capturedAt: { $gte: from, $lte: to } })
      .exec();
    return docs.map((doc) => this.toRecord(doc));
  }

  async updateStatus(
    id: string,
    change: StatusChange,
  ): Promise<HazardReportRecord | null> {
    const doc = await this.model
      .findByIdAndUpdate(id, change, { returnDocument: 'after' })
      .exec();
    return doc ? this.toRecord(doc) : null;
  }

  // Turns a database document into the plain record the services use.
  private toRecord(doc: HazardReportDocument): HazardReportRecord {
    return {
      id: doc.id,
      hazardType: doc.hazardType,
      description: doc.description,
      photoUrl: doc.photoUrl,
      latitude: doc.latitude,
      longitude: doc.longitude,
      district: String(doc.district),
      capturedAt: doc.capturedAt,
      submittedAt: doc.createdAt ?? doc.capturedAt,
      status: doc.status,
      possibleDuplicateOf: [...doc.possibleDuplicateOf],
      reporterId: doc.reporterId,
      reporterRole: doc.reporterRole,
      verifiedBy: doc.verifiedBy,
      verifiedAt: doc.verifiedAt,
      rejectionReason: doc.rejectionReason,
    };
  }
}
