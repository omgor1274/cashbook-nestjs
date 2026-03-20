import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/schemas/user.schema';
import { AttendanceStatus, AttendanceUnit } from '../attendance.enums';

export type AttendanceDocument = Attendance & Document;

@Schema({ timestamps: true })
export class Attendance {
  @Prop({ required: true, type: Date, index: true })
  attendanceDate: Date;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  workerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  markedBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: AttendanceUnit,
    required: true,
    default: AttendanceUnit.ONE,
  })
  units: AttendanceUnit;

  @Prop({
    type: String,
    enum: AttendanceStatus,
    required: true,
    default: AttendanceStatus.PRESENT,
  })
  status: AttendanceStatus;

  @Prop({ trim: true, default: '' })
  project: string;

  @Prop({ trim: true, default: '' })
  location: string;

  @Prop({ trim: true, default: '' })
  note: string;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
AttendanceSchema.index({ attendanceDate: 1, workerId: 1 }, { unique: true });
AttendanceSchema.index({ attendanceDate: 1, status: 1 });
