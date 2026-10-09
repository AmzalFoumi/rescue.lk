import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { OrganisationKind } from '../organisation.js';

/**
 * The owning organisation, copied onto every resource it owns so one query can
 * show teams and shelters from every organisation side by side. Stored as a
 * sub-document without its own _id.
 *
 * Ids use `SchemaTypes.ObjectId`, not `Types.ObjectId`. With Mongoose 9,
 * `@Prop({ type: Types.ObjectId })` quietly builds a Mixed path: nothing is
 * cast, so the field keeps whatever it was given — an ObjectId from the seed,
 * a string from a request — and a query for one form never matches the other.
 */
@Schema({ _id: false })
export class OwnerData {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Organisation', required: true })
  organisationId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, enum: Object.values(OrganisationKind), required: true })
  kind!: OrganisationKind;
}

export const OwnerDataSchema = SchemaFactory.createForClass(OwnerData);
