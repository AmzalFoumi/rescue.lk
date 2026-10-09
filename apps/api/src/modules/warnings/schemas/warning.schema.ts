import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type {
  AlertChannelType,
  WarningHazardType,
  WarningSeverity,
  WarningStatus,
} from '@rescue-lk/shared';
import {
  ALERT_CHANNEL_TYPES,
  HAZARD_TYPES,
  INITIAL_WARNING_VERSION,
  WARNING_SEVERITIES,
  WARNING_STATUSES,
} from '../warnings.constants.js';

export type WarningDocument = HydratedDocument<Warning>;

// Warning is the MongoDB document shape of a warning; only
// MongooseWarningsRepository uses it.
// Dates are set from the injected Clock (createdAt, publishedAt, updatedAt,
// cancelledAt), so Mongoose timestamps are off and tests can control time.
// SRP: the schema only describes storage. Business rules (minimum lengths, what
// publishing requires) live in WarningValidator, and enums come from
// warnings.constants (no magic strings).
@Schema({ timestamps: false, collection: 'warnings' })
export class Warning {
  @Prop({ type: Types.ObjectId, ref: 'HazardReport', required: true })
  sourceReportId!: Types.ObjectId;

  @Prop({ type: String, enum: HAZARD_TYPES, required: true })
  hazard!: WarningHazardType;

  @Prop({ type: String, default: '' })
  otherHazard!: string;

  @Prop({ type: String, enum: WARNING_SEVERITIES, required: true })
  severity!: WarningSeverity;

  @Prop({ type: [String], required: true })
  areaIds!: string[];

  @Prop({ type: String, required: true })
  message!: string;

  @Prop({ type: String, default: '' })
  instructions!: string;

  @Prop({ type: [{ type: String, enum: ALERT_CHANNEL_TYPES }], default: [] })
  channels!: AlertChannelType[];

  @Prop({ type: String, enum: WARNING_STATUSES, required: true, index: true })
  status!: WarningStatus;

  @Prop({ type: Number, required: true, min: INITIAL_WARNING_VERSION })
  version!: number;

  @Prop({ type: String, required: true })
  createdBy!: string;

  @Prop({ type: Date, required: true })
  createdAt!: Date;

  @Prop({ type: Date, default: null })
  publishedAt!: Date | null;

  @Prop({ type: Date, default: null })
  updatedAt!: Date | null;

  @Prop({ type: Date, default: null })
  cancelledAt!: Date | null;

  @Prop({ type: String, default: '' })
  cancelReason!: string;
}

export const WarningSchema = SchemaFactory.createForClass(Warning);
