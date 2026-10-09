import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { OwnerData, OwnerDataSchema } from './owner.schema.js';

export type ShelterDocument = HydratedDocument<Shelter>;

/**
 * An emergency shelter. Only the capacity and the current occupancy are
 * stored: the status (Available, Nearly Full, Full) is worked out from them,
 * so the numbers and the status can never disagree.
 */
@Schema({ timestamps: true, collection: 'shelters' })
export class Shelter {
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: OwnerDataSchema, required: true })
  owner!: OwnerData;

  @Prop({ type: Types.ObjectId, ref: 'District', required: true })
  district!: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1 })
  capacity!: number;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  currentOccupancy!: number;
}

export const ShelterSchema = SchemaFactory.createForClass(Shelter);

ShelterSchema.index({ district: 1 });
