import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/schemas/user.schema';
import {
  TransactionDirection,
  TransactionModuleType,
  TransactionPaymentMethod,
  TransactionPaymentStatus,
  TransactionPaymentType,
} from '../transaction.enums';

@Schema({ _id: false })
export class TransactionLineItem {
  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ required: true, min: 0 })
  total: number;
}

export const TransactionLineItemSchema = SchemaFactory.createForClass(TransactionLineItem);

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: String, enum: TransactionModuleType, required: true, index: true })
  moduleType: TransactionModuleType;

  @Prop({ required: true, trim: true, index: true })
  partyName: string;

  @Prop({ type: String, enum: TransactionDirection, required: true, index: true })
  direction: TransactionDirection;

  @Prop({ required: true, min: 0, index: true })
  amount: number;

  @Prop({ type: String, enum: TransactionPaymentType, required: true, index: true })
  paymentType: TransactionPaymentType;

  @Prop({ type: String, enum: TransactionPaymentMethod, required: true, index: true })
  paymentMethod: TransactionPaymentMethod;

  @Prop({
    type: String,
    enum: TransactionPaymentStatus,
    required: true,
    default: TransactionPaymentStatus.PAID,
    index: true,
  })
  paymentStatus: TransactionPaymentStatus;

  @Prop({ required: true, type: Date, index: true })
  transactionDate: Date;

  @Prop({ trim: true, default: '', index: true })
  location: string;

  @Prop({ trim: true, default: '' })
  project: string;

  @Prop({ trim: true, default: '' })
  note: string;

  @Prop({ trim: true, default: '', index: true })
  referenceNumber: string;

  @Prop({ type: [TransactionLineItemSchema], default: [] })
  billDetails: TransactionLineItem[];

  @Prop({ trim: true, default: '' })
  attachmentUrl: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, index: true, default: null })
  assignedTo: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Vendor', index: true, default: null })
  vendorId: Types.ObjectId | null;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
TransactionSchema.index({ moduleType: 1, transactionDate: -1 });
TransactionSchema.index({ moduleType: 1, paymentStatus: 1, transactionDate: -1 });
TransactionSchema.index({ moduleType: 1, location: 1, transactionDate: -1 });
TransactionSchema.index({ moduleType: 1, amount: 1 });
