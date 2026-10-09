import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DistrictDocument = HydratedDocument<District>;

@Schema({ timestamps: true, collection: 'districts' })
export class District {
  // The type is written out because tsx (used by the seed script) does not emit
  // the decorator metadata Mongoose would otherwise use to infer it.
  @Prop({ type: String, required: true, unique: true })
  name!: string;

  @Prop({ type: String, required: true })
  province!: string;

  // Centre of the district. Used when a reporter enters a location by hand.
  @Prop({ type: Number, required: true })
  latitude!: number;

  @Prop({ type: Number, required: true })
  longitude!: number;
}

export const DistrictSchema = SchemaFactory.createForClass(District);
