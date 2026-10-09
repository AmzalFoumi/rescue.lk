import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TeamStatus } from '../team-status.js';
import { OwnerData, OwnerDataSchema } from './owner.schema.js';

export type RescueTeamDocument = HydratedDocument<RescueTeam>;

// The position is stored as a sub-document without its own _id.
@Schema({ _id: false })
export class TeamLocationData {
  @Prop({ type: Number, required: true })
  latitude!: number;

  @Prop({ type: Number, required: true })
  longitude!: number;
}
const TeamLocationDataSchema = SchemaFactory.createForClass(TeamLocationData);

/** The report a dispatched team is working on. Absent while the team is free. */
@Schema({ _id: false })
export class ActiveDispatchData {
  @Prop({ type: String, required: true })
  reportId!: string;

  @Prop({ type: String, required: true })
  dispatchedBy!: string;

  @Prop({ type: Date, required: true })
  dispatchedAt!: Date;
}
const ActiveDispatchDataSchema =
  SchemaFactory.createForClass(ActiveDispatchData);

@Schema({ timestamps: true, collection: 'rescue_teams' })
export class RescueTeam {
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: OwnerDataSchema, required: true })
  owner!: OwnerData;

  @Prop({
    type: String,
    enum: Object.values(TeamStatus),
    default: TeamStatus.Available,
  })
  status!: TeamStatus;

  @Prop({ type: Types.ObjectId, ref: 'District', required: true })
  district!: Types.ObjectId;

  @Prop({ type: TeamLocationDataSchema, required: true })
  location!: TeamLocationData;

  @Prop({ type: ActiveDispatchDataSchema, default: null })
  activeDispatch?: ActiveDispatchData | null;
}

export const RescueTeamSchema = SchemaFactory.createForClass(RescueTeam);

// The officer's list is read by district and by status on every dispatch.
RescueTeamSchema.index({ district: 1, status: 1 });
