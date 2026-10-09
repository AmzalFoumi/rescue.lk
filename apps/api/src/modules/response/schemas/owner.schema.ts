import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { OrganisationKind } from '../organisation.js';

/**
 * The owning organisation, copied onto every resource it owns so one query can
 * show teams and shelters from every organisation side by side. Stored as a
 * sub-document without its own _id.
 */
@Schema({ _id: false })
export class OwnerData {
  @Prop({ type: Types.ObjectId, ref: 'Organisation', required: true })
  organisationId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ type: String, enum: Object.values(OrganisationKind), required: true })
  kind!: OrganisationKind;
}

export const OwnerDataSchema = SchemaFactory.createForClass(OwnerData);
