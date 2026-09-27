import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DistrictDocument = HydratedDocument<District>;

@Schema({ timestamps: true, collection: 'districts' })
export class District {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true })
  province!: string;
}

export const DistrictSchema = SchemaFactory.createForClass(District);
