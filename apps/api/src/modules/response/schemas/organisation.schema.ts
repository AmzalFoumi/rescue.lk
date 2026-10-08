import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { OrganisationKind } from '../organisation.js';

export type OrganisationDocument = HydratedDocument<Organisation>;

/** A body that owns rescue teams, shelters or relief supplies. */
@Schema({ timestamps: true, collection: 'organisations' })
export class Organisation {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ type: String, enum: Object.values(OrganisationKind), required: true })
  kind!: OrganisationKind;
}

export const OrganisationSchema = SchemaFactory.createForClass(Organisation);
