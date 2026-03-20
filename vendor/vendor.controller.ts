import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/role.decorators';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../user/user.enum';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { QueryVendorBillingHistoryDto, QueryVendorsDto } from './dto/query-vendors.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorService } from './vendor.service';

@Controller('vendors')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class VendorController {
  constructor(private readonly vendorService: VendorService) { }

  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPERVISOR)
  @Post()
  createVendor(@Body() createVendorDto: CreateVendorDto, @Req() req: any) {
    return this.vendorService.createVendor(createVendorDto, req.user.id);
  }

  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPERVISOR)
  @Get()
  findAllVendors(@Query() queryDto: QueryVendorsDto) {
    return this.vendorService.findAllVendors(queryDto);
  }

  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPERVISOR)
  @Get(':id')
  findVendorById(@Param('id') vendorId: string) {
    return this.vendorService.findVendorById(vendorId);
  }

  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPERVISOR)
  @Patch(':id')
  updateVendorById(@Param('id') vendorId: string, @Body() updateVendorDto: UpdateVendorDto) {
    return this.vendorService.updateVendorById(vendorId, updateVendorDto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  deleteVendorById(@Param('id') vendorId: string) {
    return this.vendorService.deleteVendorById(vendorId);
  }

  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPERVISOR)
  @Get(':id/billing-history')
  getVendorBillingHistory(
    @Param('id') vendorId: string,
    @Query() queryDto: QueryVendorBillingHistoryDto,
  ) {
    return this.vendorService.getVendorBillingHistory(vendorId, queryDto);
  }
}
