import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { SalaryCycle } from '../profile.constants';
import { UserRole } from '../user.enum';
import { UserAddressDetailsDto, UserEmergencyContactDto } from './user-profile.dto';
import { UserPermissionsDto } from './user-permissions.dto';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  fullname: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase().replace(/\s+/g, '_') : value,
  )
  role: UserRole;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(1000000000, { message: 'Phone number must be at least 10 digits long' })
  phonenumber: number;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  salary: number;

  @IsOptional()
  @IsEnum(SalaryCycle)
  salaryCycle?: SalaryCycle;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  openingbalance: number;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  pincode: number;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  bloodgroup: string;

  @IsString()
  @IsNotEmpty()
  profilepicture: string;

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
