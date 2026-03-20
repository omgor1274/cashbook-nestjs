import { IsDateString, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ReportFormat, ReportTimePeriod } from '../reports.enums';

export class DownloadReportDto {
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @IsOptional()
  @IsEnum(ReportTimePeriod)
  timePeriod?: ReportTimePeriod;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  employeeType?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsMongoId()
  supervisorId?: string;
}
