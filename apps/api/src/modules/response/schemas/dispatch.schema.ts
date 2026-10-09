import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { OwnerData, OwnerDataSchema } from './owner.schema.js';

export type DispatchDocument = HydratedDocument<Dispatch>;

/**
 * One dispatch of one team to one report. Written once and never changed: the
 * rescue team holds the current state, this is the history behind it.
 */
@Schema({ timestamps: true, collection: 'dispatches' })
export class Dispatch {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'HazardReport', required: true })
  reportId!: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'RescueTeam', required: true })
  teamId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  teamName!: string;

  @Prop({ type: OwnerDataSchema, required: true })
  owner!: OwnerData;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'District', required: true })
  district!: Types.ObjectId;

  @Prop({ type: String, required: true })
  dispatchedBy!: string;

  @Prop({ type: Date, required: true })
  dispatchedAt!: Date;
}

export const DispatchSchema = SchemaFactory.createForClass(Dispatch);

// Every report page asks "which teams are on this one".
DispatchSchema.index({ reportId: 1, dispatchedAt: -1 });
