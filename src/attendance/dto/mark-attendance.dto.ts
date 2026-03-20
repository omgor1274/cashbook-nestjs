import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AttendanceUnit } from '../attendance.enums';

export class MarkAttendanceEntryDto {
  @IsMongoId()
  workerId: string;

  @IsEnum(AttendanceUnit)
  units: AttendanceUnit;

  @IsOptional()
  @IsString()
  project?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class MarkAttendanceDto {
  @IsDateString()
  attendanceDate: string;

  @IsArray()
  @IsNotEmpty({ each: true })
  @ValidateNested({ each: true })
  @Type(() => MarkAttendanceEntryDto)
  entries: MarkAttendanceEntryDto[];
}
