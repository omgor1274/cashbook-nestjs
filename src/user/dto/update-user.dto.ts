import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { SalaryCycle } from '../profile.constants';
import { UserRole } from '../user.enum';
import {
  UserAddressDetailsDto,
  UserEmergencyContactDto,
} from './user-profile.dto';
import { UserPermissionsDto } from './user-permissions.dto';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullname?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim().toLowerCase().replace(/\s+/g, '_')
      : value,
  )
  role?: UserRole;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1000000000, { message: 'Phone number must be at least 10 digits long' })
  phonenumber?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salary?: number;

  @IsOptional()
  @IsEnum(SalaryCycle)
  salaryCycle?: SalaryCycle;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  openingbalance?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pincode?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  bloodgroup?: string;

  @IsOptional()
  @IsString()
  profilepicture?: string;

  @IsOptional()
  @IsBoolean()
  faceRecognitionEnabled?: boolean;

  @IsOptional()
  @IsString()
  faceRecognitionImage?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserAddressDetailsDto)
  addressDetails?: UserAddressDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserEmergencyContactDto)
  emergencyContact?: UserEmergencyContactDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserPermissionsDto)
  permissions?: UserPermissionsDto;
}
