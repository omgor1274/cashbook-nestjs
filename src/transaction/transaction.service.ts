import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model } from 'mongoose';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import {
  TransactionPaymentStatus,
  TransactionTimePeriod,
} from './transaction.enums';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  private normalizeStartOfDay(value: Date): Date {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private normalizeEndOfDay(value: Date): Date {
    const date = new Date(value);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private resolveDateRange(
    timePeriod?: TransactionTimePeriod,
    fromDate?: string,
    toDate?: string,
  ): { startDate: Date; endDate: Date } | null {
    const now = new Date();
    const period =
      timePeriod ??
      (fromDate || toDate ? TransactionTimePeriod.CUSTOM : undefined);

    if (!period) {
      return null;
    }

    if (period === TransactionTimePeriod.CUSTOM) {
      if (!fromDate || !toDate) {
        throw new BadRequestException(
          'fromDate and toDate are required when timePeriod is custom',
        );
      }

      return {
        startDate: this.normalizeStartOfDay(new Date(fromDate)),
        endDate: this.normalizeEndOfDay(new Date(toDate)),
      };
    }

    if (period === TransactionTimePeriod.TODAY) {
      return {
        startDate: this.normalizeStartOfDay(now),
        endDate: this.normalizeEndOfDay(now),
      };
    }

    if (period === TransactionTimePeriod.LAST_7_DAYS) {
      const startDate = this.normalizeStartOfDay(now);
      startDate.setDate(startDate.getDate() - 6);
      return {
        startDate,
        endDate: this.normalizeEndOfDay(now),
      };
    }

    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: this.normalizeStartOfDay(startDate),
      endDate: this.normalizeEndOfDay(endDate),
    };
  }

  private buildFilter(
    queryDto: QueryTransactionsDto,
  ): QueryFilter<TransactionDocument> {
    const filter: QueryFilter<TransactionDocument> = {};

    if (queryDto.moduleType) {
      filter.moduleType = queryDto.moduleType;
    }

    if (queryDto.paymentType) {
      filter.paymentType = queryDto.paymentType;
    }

    if (queryDto.paymentMethod) {
      filter.paymentMethod = queryDto.paymentMethod;
    }

    if (queryDto.paymentStatus) {
      filter.paymentStatus = queryDto.paymentStatus;
    }

    if (queryDto.location) {
      filter.location = {
        $regex: new RegExp(
          `^${this.escapeRegex(queryDto.location.trim())}`,
          'i',
        ),
      };
    }

    if (queryDto.minAmount !== undefined || queryDto.maxAmount !== undefined) {
      filter.amount = {};
      if (queryDto.minAmount !== undefined) {
        filter.amount.$gte = queryDto.minAmount;
      }
      if (queryDto.maxAmount !== undefined) {
        filter.amount.$lte = queryDto.maxAmount;
      }
    }

    const dateRange = this.resolveDateRange(
      queryDto.timePeriod,
      queryDto.fromDate,
      queryDto.toDate,
    );
    if (dateRange) {
      filter.transactionDate = {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate,
      };
    }

    if (queryDto.search?.trim()) {
      const searchRegex = new RegExp(
        this.escapeRegex(queryDto.search.trim()),
        'i',
      );
      filter.$or = [
        { partyName: searchRegex },
        { referenceNumber: searchRegex },
        { note: searchRegex },
        { location: searchRegex },
      ];
    }

    return filter;
  }

  async createTransaction(
    createTransactionDto: CreateTransactionDto,
    createdBy: string,
  ) {
    const createdTransaction = new this.transactionModel({
      ...createTransactionDto,
      paymentStatus:
        createTransactionDto.paymentStatus ?? TransactionPaymentStatus.PAID,
      transactionDate: new Date(createTransactionDto.transactionDate),
      createdBy,
    });

    const savedTransaction = await createdTransaction.save();
    return savedTransaction.toObject();
  }

  async findAllTransactions(queryDto: QueryTransactionsDto) {
    const page = queryDto.page ?? 1;
    const limit = queryDto.limit ?? 20;
    const skip = (page - 1) * limit;
    const filter = this.buildFilter(queryDto);

    const [items, total, summaryRows] = await Promise.all([
      this.transactionModel
        .find(filter)
        .sort({ transactionDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'fullname email role specialIndex')
        .populate('assignedTo', 'fullname email role specialIndex')
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
              internalTransferAmount: {
                $sum: {
                  $cond: [
                    { $eq: ['$paymentType', 'internal_transfer'] },
                    '$amount',
                    0,
                  ],
                },
              },
              count: { $sum: 1 },
            },
          },
        ])
        .exec(),
    ]);

    const summary = summaryRows[0] ?? {
      totalAmount: 0,
      creditAmount: 0,
      debitAmount: 0,
      internalTransferAmount: 0,
      count: 0,
    };

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      summary,
    };
  }

  async findTransactionById(transactionId: string) {
    const transaction = await this.transactionModel
      .findById(transactionId)
      .populate('createdBy', 'fullname email role specialIndex')
      .populate('assignedTo', 'fullname email role specialIndex')
      .lean()
      .exec();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async updateTransactionById(
    transactionId: string,
    updateTransactionDto: UpdateTransactionDto,
  ) {
    const payload: Record<string, unknown> = { ...updateTransactionDto };

    if (updateTransactionDto.transactionDate) {
      payload.transactionDate = new Date(updateTransactionDto.transactionDate);
    }

    const updatedTransaction = await this.transactionModel
      .findByIdAndUpdate(transactionId, payload, {
        returnDocument: 'after',
        runValidators: true,
      })
      .lean()
      .exec();

    if (!updatedTransaction) {
      throw new NotFoundException('Transaction not found');
    }

    return updatedTransaction;
  }

  async deleteTransactionById(transactionId: string) {
    const deletedTransaction = await this.transactionModel
      .findByIdAndDelete(transactionId)
      .lean()
      .exec();

    if (!deletedTransaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      message: 'Transaction deleted successfully',
      transaction: deletedTransaction,
    };
  }
}
