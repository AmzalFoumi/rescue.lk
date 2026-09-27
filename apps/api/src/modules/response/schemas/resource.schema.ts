import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ResourceDocument = HydratedDocument<Resource>;

@Schema({ timestamps: true, collection: 'resources' })
export class Resource {
  @Prop({ type: Types.ObjectId, ref: 'District', required: true })
  district!: Types.ObjectId;
}

export const ResourceSchema = SchemaFactory.createForClass(Resource);
