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
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionService } from './transaction.service';

@Controller('transactions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPERVISOR)
  @Post()
  createTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
    @Req() req: any,
  ) {
    return this.transactionService.createTransaction(
      createTransactionDto,
      req.user.id,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPERVISOR)
  @Get()
  findAllTransactions(@Query() queryDto: QueryTransactionsDto) {
    return this.transactionService.findAllTransactions(queryDto);
  }

  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPERVISOR)
  @Get(':id')
  findTransactionById(@Param('id') transactionId: string) {
    return this.transactionService.findTransactionById(transactionId);
  }

  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPERVISOR)
  @Patch(':id')
  updateTransactionById(
    @Param('id') transactionId: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionService.updateTransactionById(
      transactionId,
      updateTransactionDto,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @Delete(':id')
  deleteTransactionById(@Param('id') transactionId: string) {
    return this.transactionService.deleteTransactionById(transactionId);
  }
}
