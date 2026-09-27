import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type HazardReportDocument = HydratedDocument<HazardReport>;

@Schema({ timestamps: true, collection: 'hazard_reports' })
export class HazardReport {
  @Prop({ type: Types.ObjectId, ref: 'District', required: true })
  district!: Types.ObjectId;
}

export const HazardReportSchema = SchemaFactory.createForClass(HazardReport);
