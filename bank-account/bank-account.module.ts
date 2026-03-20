import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BankAccountController } from './bank-account.controller';
import { BankAccountService } from './bank-account.service';
import { BankAccount, BankAccountSchema } from './schemas/bank-account.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: BankAccount.name, schema: BankAccountSchema }]),
  ],
  controllers: [BankAccountController],
  providers: [BankAccountService],
  exports: [BankAccountService, MongooseModule],
})
export class BankAccountModule {}
