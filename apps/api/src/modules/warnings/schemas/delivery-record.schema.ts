import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { AlertChannelType, DeliveryStatus } from '@rescue-lk/shared';
import {
  ALERT_CHANNEL_TYPES,
  DELIVERY_STATUSES,
  INITIAL_DELIVERY_ATTEMPTS,
  INITIAL_WARNING_VERSION,
  NO_ERROR,
  NO_RECIPIENTS,
} from '../warnings.constants.js';
import { Warning } from './warning.schema.js';

export type DeliveryRecordDocument = HydratedDocument<DeliveryRecord>;

@Schema({ timestamps: true, collection: 'delivery_records' })
export class DeliveryRecord {
  @Prop({ type: Types.ObjectId, ref: Warning.name, required: true })
  warningId!: Types.ObjectId;

  // Each publish or update sends a new version; the UI shows the latest one.
  @Prop({ type: Number, required: true, min: INITIAL_WARNING_VERSION })
  warningVersion!: number;

  @Prop({ type: String, enum: ALERT_CHANNEL_TYPES, required: true })
  channel!: AlertChannelType;

  @Prop({ type: String, enum: DELIVERY_STATUSES, required: true })
  status!: DeliveryStatus;

  @Prop({
    type: Number,
    min: INITIAL_DELIVERY_ATTEMPTS,
    default: INITIAL_DELIVERY_ATTEMPTS,
  })
  attempts!: number;

  @Prop({ type: Number, min: NO_RECIPIENTS, default: NO_RECIPIENTS })
  recipients!: number;

  @Prop({ type: Date, default: null })
  lastAttemptAt!: Date | null;

  @Prop({ type: String, default: NO_ERROR })
  error!: string;
}

export const DeliveryRecordSchema =
  SchemaFactory.createForClass(DeliveryRecord);

// latestDeliveries() reads the records of one warning version.
DeliveryRecordSchema.index({ warningId: 1, warningVersion: 1 });
