import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model } from 'mongoose';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { QueryBankAccountsDto } from './dto/query-bank-accounts.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import {
  BankAccount,
  BankAccountDocument,
} from './schemas/bank-account.schema';

@Injectable()
export class BankAccountService {
  constructor(
    @InjectModel(BankAccount.name)
    private readonly bankAccountModel: Model<BankAccountDocument>,
  ) {}

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async createBankAccount(
    createBankAccountDto: CreateBankAccountDto,
    createdBy: string,
  ) {
    const createdBankAccount = new this.bankAccountModel({
      ...createBankAccountDto,
      accountHolderName: createBankAccountDto.accountHolderName.trim(),
      bankName: createBankAccountDto.bankName.trim(),
      accountNumber: createBankAccountDto.accountNumber.trim(),
      ifscCode: createBankAccountDto.ifscCode.trim().toUpperCase(),
      branchName: createBankAccountDto.branchName?.trim() ?? '',
      createdBy,
    });

    const savedBankAccount = await createdBankAccount.save();
    return savedBankAccount.toObject();
  }

  async findAllBankAccounts(queryDto: QueryBankAccountsDto) {
    const page = queryDto.page ?? 1;
    const limit = queryDto.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: QueryFilter<BankAccountDocument> = {};
    if (queryDto.search?.trim()) {
      const regex = new RegExp(this.escapeRegex(queryDto.search.trim()), 'i');
      filter.$or = [
        { accountHolderName: regex },
        { bankName: regex },
        { accountNumber: regex },
        { ifscCode: regex },
      ];
    }

    const [items, total] = await Promise.all([
      this.bankAccountModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.bankAccountModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findBankAccountById(bankAccountId: string) {
    const bankAccount = await this.bankAccountModel
      .findById(bankAccountId)
      .lean()
      .exec();
    if (!bankAccount) {
      throw new NotFoundException('Bank account not found');
    }

    return bankAccount;
  }

  async updateBankAccountById(
    bankAccountId: string,
    updateBankAccountDto: UpdateBankAccountDto,
  ) {
    const payload: Record<string, unknown> = {
      ...updateBankAccountDto,
    };

    if (updateBankAccountDto.accountHolderName !== undefined) {
      payload.accountHolderName = updateBankAccountDto.accountHolderName.trim();
    }

    if (updateBankAccountDto.bankName !== undefined) {
      payload.bankName = updateBankAccountDto.bankName.trim();
    }

    if (updateBankAccountDto.accountNumber !== undefined) {
      payload.accountNumber = updateBankAccountDto.accountNumber.trim();
    }

    if (updateBankAccountDto.ifscCode !== undefined) {
      payload.ifscCode = updateBankAccountDto.ifscCode.trim().toUpperCase();
    }

    if (updateBankAccountDto.branchName !== undefined) {
      payload.branchName = updateBankAccountDto.branchName.trim();
    }

    const updatedBankAccount = await this.bankAccountModel
      .findByIdAndUpdate(bankAccountId, payload, {
        returnDocument: 'after',
        runValidators: true,
      })
      .lean()
      .exec();

    if (!updatedBankAccount) {
      throw new NotFoundException('Bank account not found');
    }

    return updatedBankAccount;
  }

  async deleteBankAccountById(bankAccountId: string) {
    const deletedBankAccount = await this.bankAccountModel
      .findByIdAndDelete(bankAccountId)
      .lean()
      .exec();

    if (!deletedBankAccount) {
      throw new NotFoundException('Bank account not found');
    }

    return {
      message: 'Bank account deleted successfully',
      bankAccount: deletedBankAccount,
    };
  }
}
