import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/schemas/user.schema';
import { BankAccountType } from '../bank-account.enums';

export type BankAccountDocument = BankAccount & Document;

@Schema({ timestamps: true })
export class BankAccount {
  @Prop({ required: true, trim: true, index: true })
  accountHolderName: string;

  @Prop({ required: true, trim: true, index: true })
  bankName: string;

  @Prop({ required: true, trim: true, index: true })
  accountNumber: string;

  @Prop({ required: true, trim: true, uppercase: true, index: true })
  ifscCode: string;

  @Prop({ type: String, enum: BankAccountType, required: true, default: BankAccountType.SAVINGS })
  accountType: BankAccountType;

  @Prop({ trim: true, default: '' })
  branchName: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  createdBy: Types.ObjectId;
}

export const BankAccountSchema = SchemaFactory.createForClass(BankAccount);
BankAccountSchema.index({
  accountHolderName: 'text',
  bankName: 'text',
  accountNumber: 'text',
  ifscCode: 'text',
});
