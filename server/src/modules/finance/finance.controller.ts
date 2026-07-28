import { Controller, Get, Post, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TransactionType, TransactionCategory } from '@prisma/client';

@ApiTags('Business - Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get total income, expense, and net balance' })
  getSummary() {
    return this.financeService.getSummary();
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List financial ledger transactions' })
  findAll(
    @Query('type') type?: TransactionType,
    @Query('category') category?: TransactionCategory,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.findAll({ type, category, startDate, endDate });
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get transaction detail' })
  findOne(@Param('id') id: string) {
    return this.financeService.findOne(id);
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Record a manual ledger transaction' })
  create(@Body() dto: CreateTransactionDto, @Request() req: any) {
    return this.financeService.create(dto, req.user.id);
  }
}
