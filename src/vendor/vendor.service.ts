import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
} from '../transaction/schemas/transaction.schema';
import { CreateVendorDto, VendorAddressDto } from './dto/create-vendor.dto';
import {
  QueryVendorBillingHistoryDto,
  QueryVendorsDto,
} from './dto/query-vendors.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { Vendor, VendorDocument } from './schemas/vendor.schema';

@Injectable()
export class VendorService {
  constructor(
    @InjectModel(Vendor.name)
    private readonly vendorModel: Model<VendorDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private normalizeAddress(address?: VendorAddressDto) {
    return {
      pincode: address?.pincode,
      city: address?.city?.trim() ?? '',
      state: address?.state?.trim() ?? '',
      building: address?.building?.trim() ?? '',
      landmark: address?.landmark?.trim() ?? '',
    };
  }

  async createVendor(createVendorDto: CreateVendorDto, createdBy: string) {
    const createdVendor = new this.vendorModel({
      ...createVendorDto,
      vendorName: createVendorDto.vendorName.trim(),
      contactName: createVendorDto.contactName.trim(),
      category: createVendorDto.category.trim(),
      phoneCode: createVendorDto.phoneCode?.trim() ?? '+91',
      phoneNumber: createVendorDto.phoneNumber.trim(),
      gstin: createVendorDto.gstin.trim().toUpperCase(),
      pan: createVendorDto.pan?.trim().toUpperCase() ?? '',
      onWebsite: createVendorDto.onWebsite ?? false,
      address: this.normalizeAddress(createVendorDto.address),
      createdBy,
    });

    const savedVendor = await createdVendor.save();
    return savedVendor.toObject();
  }

  async findAllVendors(queryDto: QueryVendorsDto) {
    const page = queryDto.page ?? 1;
    const limit = queryDto.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: QueryFilter<VendorDocument> = {};
    if (queryDto.search?.trim()) {
      const searchRegex = new RegExp(
        this.escapeRegex(queryDto.search.trim()),
        'i',
      );
      filter.$or = [
        { vendorName: searchRegex },
        { contactName: searchRegex },
        { category: searchRegex },
        { phoneNumber: searchRegex },
        { gstin: searchRegex },
      ];
    }

    const [items, total] = await Promise.all([
      this.vendorModel
        .find(filter)
        .sort({ vendorName: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.vendorModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findVendorById(vendorId: string) {
    const vendor = await this.vendorModel.findById(vendorId).lean().exec();
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async updateVendorById(vendorId: string, updateVendorDto: UpdateVendorDto) {
    const payload: Record<string, unknown> = {
      ...updateVendorDto,
    };

    if (updateVendorDto.vendorName !== undefined) {
      payload.vendorName = updateVendorDto.vendorName.trim();
    }

    if (updateVendorDto.contactName !== undefined) {
      payload.contactName = updateVendorDto.contactName.trim();
    }

    if (updateVendorDto.category !== undefined) {
      payload.category = updateVendorDto.category.trim();
    }

    if (updateVendorDto.phoneCode !== undefined) {
      payload.phoneCode = updateVendorDto.phoneCode.trim();
    }

    if (updateVendorDto.phoneNumber !== undefined) {
      payload.phoneNumber = updateVendorDto.phoneNumber.trim();
    }

    if (updateVendorDto.gstin !== undefined) {
      payload.gstin = updateVendorDto.gstin.trim().toUpperCase();
    }

    if (updateVendorDto.pan !== undefined) {
      payload.pan = updateVendorDto.pan.trim().toUpperCase();
    }

    if (updateVendorDto.address !== undefined) {
      payload.address = this.normalizeAddress(updateVendorDto.address);
    }

    const updatedVendor = await this.vendorModel
      .findByIdAndUpdate(vendorId, payload, {
        returnDocument: 'after',
        runValidators: true,
      })
      .lean()
      .exec();

    if (!updatedVendor) {
      throw new NotFoundException('Vendor not found');
    }

    return updatedVendor;
  }

  async deleteVendorById(vendorId: string) {
    const deletedVendor = await this.vendorModel
      .findByIdAndDelete(vendorId)
      .lean()
      .exec();
    if (!deletedVendor) {
      throw new NotFoundException('Vendor not found');
    }

    return {
      message: 'Vendor deleted successfully',
      vendor: deletedVendor,
    };
  }

  async getVendorBillingHistory(
    vendorId: string,
    queryDto: QueryVendorBillingHistoryDto,
  ) {
    await this.findVendorById(vendorId);

    const page = queryDto.page ?? 1;
    const limit = queryDto.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: QueryFilter<TransactionDocument> = { vendorId };
    if (queryDto.moduleType) {
      filter.moduleType = queryDto.moduleType;
    }

    const [items, total, summaryRows] = await Promise.all([
      this.transactionModel
        .find(filter)
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.transactionModel.countDocuments(filter).exec(),
      this.transactionModel
        .aggregate([
          { $match: filter },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' },
              creditAmount: {
                $sum: {
                  $cond: [{ $eq: ['$direction', 'credit'] }, '$amount', 0],
                },
              },
              debitAmount: {
                $sum: {
                  $cond: [{ $eq: ['$direction', 'debit'] }, '$amount', 0],
                },
              },
              count: { $sum: 1 },
            },
          },
        ])
        .exec(),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      summary: summaryRows[0] ?? {
        totalAmount: 0,
        creditAmount: 0,
        debitAmount: 0,
        count: 0,
      },
    };
  }
}
