import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/schemas/user.schema';

@Schema({ _id: false })
export class VendorAddress {
  @Prop({ type: Number })
  pincode?: number;

  @Prop({ trim: true, default: '' })
  city?: string;

  @Prop({ trim: true, default: '' })
  state?: string;

  @Prop({ trim: true, default: '' })
  building?: string;

  @Prop({ trim: true, default: '' })
  landmark?: string;
}

export const VendorAddressSchema = SchemaFactory.createForClass(VendorAddress);

export type VendorDocument = Vendor & Document;

@Schema({ timestamps: true })
export class Vendor {
  @Prop({ required: true, trim: true, index: true })
  vendorName: string;

  @Prop({ required: true, trim: true, index: true })
  contactName: string;

  @Prop({ required: true, trim: true, index: true })
  category: string;

  @Prop({ trim: true, default: '+91' })
  phoneCode: string;

  @Prop({ required: true, trim: true, index: true })
  phoneNumber: string;

  @Prop({ required: true, trim: true, uppercase: true, index: true })
  gstin: string;

  @Prop({ trim: true, uppercase: true, default: '' })
  pan: string;

  @Prop({ type: Boolean, default: false })
  onWebsite: boolean;

  @Prop({ type: VendorAddressSchema, default: {} })
  address: VendorAddress;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  createdBy: Types.ObjectId;
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);
VendorSchema.index({ vendorName: 'text', contactName: 'text', category: 'text', phoneNumber: 'text' });
