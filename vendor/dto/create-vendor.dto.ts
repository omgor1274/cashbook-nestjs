import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class VendorAddressDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pincode?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  building?: string;

  @IsOptional()
  @IsString()
  landmark?: string;
}

export class CreateVendorDto {
  @IsString()
  @IsNotEmpty()
  vendorName: string;

  @IsString()
  @IsNotEmpty()
  contactName: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsOptional()
  @IsString()
  phoneCode?: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  gstin: string;

  @IsOptional()
  @IsString()
  pan?: string;

  @IsOptional()
  @IsBoolean()
  onWebsite?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => VendorAddressDto)
  address?: VendorAddressDto;
}
