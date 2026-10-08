import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { HazardReportStatus } from '../hazard-report-status.js';
import { HazardType, ReporterRole } from '../hazard-type.js';

export type HazardReportDocument = HydratedDocument<HazardReport>;

@Schema({ timestamps: true, collection: 'hazard_reports' })
export class HazardReport {
  @Prop({ type: String, enum: Object.values(HazardType), required: true })
  hazardType!: HazardType;

  @Prop({ required: true })
  description!: string;

  @Prop()
  photoUrl?: string;

  @Prop({ required: true })
  latitude!: number;

  @Prop({ required: true })
  longitude!: number;

  @Prop({ type: Types.ObjectId, ref: 'District', required: true })
  district!: Types.ObjectId;

  @Prop({ required: true })
  capturedAt!: Date;

  @Prop({
    type: String,
    enum: Object.values(HazardReportStatus),
    default: HazardReportStatus.PendingVerification,
  })
  status!: HazardReportStatus;

  // Ids of earlier reports that look like the same event (checkDuplicate).
  @Prop({ type: [String], default: [] })
  possibleDuplicateOf!: string[];

  @Prop({ required: true })
  reporterId!: string;

  @Prop({ type: String, enum: Object.values(ReporterRole), required: true })
  reporterRole!: ReporterRole;

  @Prop()
  verifiedBy?: string;

  @Prop()
  verifiedAt?: Date;

  @Prop()
  rejectionReason?: string;
}

export const HazardReportSchema = SchemaFactory.createForClass(HazardReport);
