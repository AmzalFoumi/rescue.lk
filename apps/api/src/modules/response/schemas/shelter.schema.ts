import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ShelterDocument = HydratedDocument<Shelter>;

@Schema({ timestamps: true, collection: 'shelters' })
export class Shelter {
  @Prop({ type: Types.ObjectId, ref: 'District', required: true })
  district!: Types.ObjectId;
}

export const ShelterSchema = SchemaFactory.createForClass(Shelter);
