import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { SalaryCycle } from '../profile.constants';

export class UserAddressDetailsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
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

export class UserEmergencyContactDto {
  @IsOptional()
  @IsString()
  fullname?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1000000000, { message: 'Phone number must be at least 10 digits long' })
  phonenumber?: number;

  @IsOptional()
  @IsString()
  relation?: string;
}

export class UserProfileSectionDto {
  @IsOptional()
  @IsEnum(SalaryCycle)
  salaryCycle?: SalaryCycle;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserAddressDetailsDto)
  addressDetails?: UserAddressDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserEmergencyContactDto)
  emergencyContact?: UserEmergencyContactDto;
}
