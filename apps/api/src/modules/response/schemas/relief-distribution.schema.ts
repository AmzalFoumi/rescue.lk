import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { ReliefItem } from '../relief-distribution.js';
import { OwnerData, OwnerDataSchema } from './owner.schema.js';

export type ReliefDistributionDocument = HydratedDocument<ReliefDistribution>;

/** One delivery of relief supplies, logged as it is distributed. */
@Schema({ timestamps: true, collection: 'relief_distributions' })
export class ReliefDistribution {
  @Prop({ type: String, enum: Object.values(ReliefItem), required: true })
  item!: ReliefItem;

  @Prop({ type: Number, required: true, min: 1 })
  quantity!: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'District', required: true })
  district!: Types.ObjectId;

  @Prop({ type: OwnerDataSchema, required: true })
  owner!: OwnerData;

  @Prop({ type: Date, required: true })
  distributedAt!: Date;
}

export const ReliefDistributionSchema =
  SchemaFactory.createForClass(ReliefDistribution);

// Resource distribution by district is one of the four required reports.
ReliefDistributionSchema.index({ district: 1, distributedAt: -1 });
