import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { createDefaultUserPermissions } from '../permissions.constants';
import type { UserPermissions } from '../permissions.constants';
import {
  createDefaultAddressDetails,
  createDefaultEmergencyContact,
  SalaryCycle,
} from '../profile.constants';
import type {
  UserAddressDetails,
  UserEmergencyContact,
} from '../profile.constants';
import { UserRole } from '../user.enum';

export type UserDocument = User & Document;
export type Userdocument = UserDocument;

@Schema()
export class User {
  @Prop({ required: true })
  fullname: string;

  @Prop({
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.WORKER,
    index: true,
  })
  role: UserRole;

  @Prop({
    required: true,
    unique: true,
    index: true,
    sparse: true,
    uppercase: true,
    trim: true,
  })
  specialIndex: string;

  @Prop({
    type: {
      bills: { type: Boolean, default: false },
      funds: { type: Boolean, default: false },
      attendance: { type: Boolean, default: false },
      users: {
        subAdmin: { type: Boolean, default: false },
        supervisor: { type: Boolean, default: false },
        worker: { type: Boolean, default: false },
        vendor: { type: Boolean, default: false },
      },
      salary: { type: Boolean, default: false },
      invoiceGeneration: { type: Boolean, default: false },
      bankAccountManagement: { type: Boolean, default: false },
    },
    default: createDefaultUserPermissions,
  })
  permissions: UserPermissions;

  @Prop({ required: true })
  phonenumber: string;

  @Prop({ required: true })
  salary: number;

  @Prop({
    type: String,
    enum: SalaryCycle,
    default: SalaryCycle.MONTHLY,
    index: true,
  })
  salaryCycle: SalaryCycle;

  @Prop({ required: true })
  openingbalance: number;

  @Prop({ required: true })
  pincode: string;

  @Prop({ required: true })
  address: string;

  @Prop({
    type: {
      pincode: { type: String },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      building: { type: String, trim: true },
      landmark: { type: String, trim: true },
    },
    default: createDefaultAddressDetails,
  })
  addressDetails: UserAddressDetails;

  @Prop({ required: true })
  bloodgroup: string;

  @Prop({ required: true })
  profilepicture: string;

  @Prop({ type: Boolean, default: false })
  faceRecognitionEnabled: boolean;

  @Prop({ type: String, default: null, trim: true })
  faceRecognitionImage?: string;

  @Prop({
    type: {
      fullname: { type: String, trim: true },
      phonenumber: { type: String },
      relation: { type: String, trim: true },
    },
    default: createDefaultEmergencyContact,
  })
  emergencyContact: UserEmergencyContact;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ role: 1, specialIndex: 1 });
