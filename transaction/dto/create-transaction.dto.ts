import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  TransactionDirection,
  TransactionModuleType,
  TransactionPaymentMethod,
  TransactionPaymentStatus,
  TransactionPaymentType,
} from '../transaction.enums';

export class TransactionLineItemDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total: number;
}

export class CreateTransactionDto {
  @IsEnum(TransactionModuleType)
  moduleType: TransactionModuleType;

  @IsString()
  @IsNotEmpty()
  partyName: string;

  @IsEnum(TransactionDirection)
  direction: TransactionDirection;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(TransactionPaymentType)
  paymentType: TransactionPaymentType;

  @IsEnum(TransactionPaymentMethod)
  paymentMethod: TransactionPaymentMethod;

  @IsOptional()
  @IsEnum(TransactionPaymentStatus)
  paymentStatus?: TransactionPaymentStatus;

  @IsDateString()
  transactionDate: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  project?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionLineItemDto)
  billDetails?: TransactionLineItemDto[];

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsOptional()
  @IsMongoId()
  assignedTo?: string;

  @IsOptional()
  @IsMongoId()
  vendorId?: string;
}
