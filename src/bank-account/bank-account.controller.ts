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
import { BankAccountService } from './bank-account.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { QueryBankAccountsDto } from './dto/query-bank-accounts.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

@Controller('bank-accounts')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BankAccountController {
  constructor(private readonly bankAccountService: BankAccountService) {}

  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPERVISOR)
  @Post()
  createBankAccount(
    @Body() createBankAccountDto: CreateBankAccountDto,
    @Req() req: any,
  ) {
    return this.bankAccountService.createBankAccount(
      createBankAccountDto,
      req.user.id,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPERVISOR)
  @Get()
  findAllBankAccounts(@Query() queryDto: QueryBankAccountsDto) {
    return this.bankAccountService.findAllBankAccounts(queryDto);
  }

  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPERVISOR)
  @Get(':id')
  findBankAccountById(@Param('id') bankAccountId: string) {
    return this.bankAccountService.findBankAccountById(bankAccountId);
  }

  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPERVISOR)
  @Patch(':id')
  updateBankAccountById(
    @Param('id') bankAccountId: string,
    @Body() updateBankAccountDto: UpdateBankAccountDto,
  ) {
    return this.bankAccountService.updateBankAccountById(
      bankAccountId,
      updateBankAccountDto,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN)
  @Delete(':id')
  deleteBankAccountById(@Param('id') bankAccountId: string) {
    return this.bankAccountService.deleteBankAccountById(bankAccountId);
  }
}
