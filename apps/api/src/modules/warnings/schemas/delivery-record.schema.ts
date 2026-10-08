import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { AlertChannelType, DeliveryStatus } from '@rescue-lk/shared';
import {
  ALERT_CHANNEL_TYPES,
  DEFAULT_DELIVERY_STATUS,
  DELIVERY_STATUSES,
  INITIAL_DELIVERY_ATTEMPTS,
} from '../warnings.constants.js';
import { Warning } from './warning.schema.js';

export type DeliveryRecordDocument = HydratedDocument<DeliveryRecord>;

@Schema({ timestamps: true, collection: 'delivery_records' })
export class DeliveryRecord {
  @Prop({
    type: Types.ObjectId,
    ref: Warning.name,
    required: true,
    index: true,
  })
  warningId!: Types.ObjectId;

  @Prop({ type: String, enum: ALERT_CHANNEL_TYPES, required: true })
  channel!: AlertChannelType;

  @Prop({
    type: String,
    enum: DELIVERY_STATUSES,
    default: DEFAULT_DELIVERY_STATUS,
  })
  status!: DeliveryStatus;

  @Prop({
    type: Number,
    min: INITIAL_DELIVERY_ATTEMPTS,
    default: INITIAL_DELIVERY_ATTEMPTS,
  })
  attempts!: number;

  @Prop({ type: String })
  failureReason?: string;

  @Prop({ type: Date })
  lastAttemptAt?: Date;
}

export const DeliveryRecordSchema =
  SchemaFactory.createForClass(DeliveryRecord);
