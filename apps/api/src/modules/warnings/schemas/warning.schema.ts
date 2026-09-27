import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WarningDocument = HydratedDocument<Warning>;

@Schema({ timestamps: true, collection: 'warnings' })
export class Warning {
  @Prop({ type: Types.ObjectId, ref: 'District', required: true })
  district!: Types.ObjectId;
}

export const WarningSchema = SchemaFactory.createForClass(Warning);
