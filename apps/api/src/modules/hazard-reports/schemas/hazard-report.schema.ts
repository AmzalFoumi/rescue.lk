import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { HazardReportStatus } from '../hazard-report-status.js';
import { HazardType } from '../hazard-type.js';
import { ReporterRole } from '../reporter-role.js';

export type HazardReportDocument = HydratedDocument<HazardReport>;

// The position is stored as a sub-document without its own _id.
@Schema({ _id: false })
export class LocationData {
  @Prop({ required: true })
  latitude!: number;

  @Prop({ required: true })
  longitude!: number;
}
const LocationDataSchema = SchemaFactory.createForClass(LocationData);

@Schema({ timestamps: true, collection: 'hazard_reports' })
export class HazardReport {
  @Prop({ type: String, enum: Object.values(HazardType), required: true })
  hazardType!: HazardType;

  @Prop({ required: true })
  description!: string;

  @Prop()
  photoUrl?: string;

  @Prop()
  placeName?: string;

  @Prop()
  reporterName?: string;

  @Prop()
  otherHazard?: string;

  @Prop({ type: LocationDataSchema, required: true })
  location!: LocationData;

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

  // Added by Mongoose because of `timestamps: true`.
  createdAt?: Date;
}

export const HazardReportSchema = SchemaFactory.createForClass(HazardReport);
