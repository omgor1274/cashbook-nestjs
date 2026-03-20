import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  TransactionModuleType,
  TransactionPaymentMethod,
  TransactionPaymentStatus,
  TransactionPaymentType,
  TransactionTimePeriod,
} from '../transaction.enums';

export class QueryTransactionsDto {
  @IsOptional()
  @IsEnum(TransactionModuleType)
  moduleType?: TransactionModuleType;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(TransactionTimePeriod)
  timePeriod?: TransactionTimePeriod;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsEnum(TransactionPaymentType)
  paymentType?: TransactionPaymentType;

  @IsOptional()
  @IsEnum(TransactionPaymentMethod)
  paymentMethod?: TransactionPaymentMethod;

  @IsOptional()
  @IsEnum(TransactionPaymentStatus)
  paymentStatus?: TransactionPaymentStatus;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
