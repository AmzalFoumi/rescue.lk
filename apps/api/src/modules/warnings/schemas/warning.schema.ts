import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type {
  AlertChannelType,
  WarningSeverity,
  WarningStatus,
} from '@rescue-lk/shared';
import {
  ALERT_CHANNEL_TYPES,
  DEFAULT_WARNING_STATUS,
  WARNING_MESSAGE_MAX_LENGTH,
  WARNING_MESSAGE_MIN_LENGTH,
  WARNING_SEVERITIES,
  WARNING_STATUSES,
  WARNING_TITLE_MAX_LENGTH,
  WARNING_TITLE_MIN_LENGTH,
} from '../warnings.constants.js';

export type WarningDocument = HydratedDocument<Warning>;

@Schema({ timestamps: true, collection: 'warnings' })
export class Warning {
  @Prop({ type: Types.ObjectId, ref: 'HazardReport', required: true })
  hazardReportId!: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    trim: true,
    minlength: WARNING_TITLE_MIN_LENGTH,
    maxlength: WARNING_TITLE_MAX_LENGTH,
  })
  title!: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    minlength: WARNING_MESSAGE_MIN_LENGTH,
    maxlength: WARNING_MESSAGE_MAX_LENGTH,
  })
  message!: string;

  @Prop({ type: String, enum: WARNING_SEVERITIES, required: true })
  severity!: WarningSeverity;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'District' }], required: true })
  districts!: Types.ObjectId[];

  @Prop({ type: [{ type: String, enum: ALERT_CHANNEL_TYPES }], required: true })
  channels!: AlertChannelType[];

  @Prop({
    type: String,
    enum: WARNING_STATUSES,
    default: DEFAULT_WARNING_STATUS,
    index: true,
  })
  status!: WarningStatus;

  @Prop({ type: Date, required: true })
  issuedAt!: Date;

  @Prop({ type: Date, required: true })
  expiresAt!: Date;
}

export const WarningSchema = SchemaFactory.createForClass(Warning);
