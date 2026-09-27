import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type IncidentDocument = HydratedDocument<Incident>;

@Schema({ timestamps: true, collection: 'incidents' })
export class Incident {
  @Prop({ type: Types.ObjectId, ref: 'District', required: true })
  district!: Types.ObjectId;
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);
