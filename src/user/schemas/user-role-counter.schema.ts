import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../user.enum';

export type UserRoleCounterDocument = UserRoleCounter & Document;

@Schema({ versionKey: false })
export class UserRoleCounter {
  @Prop({
    type: String,
    enum: UserRole,
    required: true,
    unique: true,
    index: true,
  })
  role: UserRole;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  sequence: number;
}

export const UserRoleCounterSchema =
  SchemaFactory.createForClass(UserRoleCounter);
