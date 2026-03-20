import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';

export class UserPermissionsUsersDto {
  @IsOptional()
  @IsBoolean()
  subAdmin?: boolean;

  @IsOptional()
  @IsBoolean()
  supervisor?: boolean;

  @IsOptional()
  @IsBoolean()
  worker?: boolean;

  @IsOptional()
  @IsBoolean()
  vendor?: boolean;
}

export class UserPermissionsDto {
  @IsOptional()
  @IsBoolean()
  bills?: boolean;

  @IsOptional()
  @IsBoolean()
  funds?: boolean;

  @IsOptional()
  @IsBoolean()
  attendance?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserPermissionsUsersDto)
  users?: UserPermissionsUsersDto;

  @IsOptional()
  @IsBoolean()
  salary?: boolean;

  @IsOptional()
  @IsBoolean()
  invoiceGeneration?: boolean;

  @IsOptional()
  @IsBoolean()
  bankAccountManagement?: boolean;
}
