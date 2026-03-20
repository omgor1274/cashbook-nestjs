import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Transaction,
  TransactionSchema,
} from '../transaction/schemas/transaction.schema';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';
import { Vendor, VendorSchema } from './schemas/vendor.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vendor.name, schema: VendorSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [VendorController],
  providers: [VendorService],
  exports: [VendorService, MongooseModule],
})
export class VendorModule {}
