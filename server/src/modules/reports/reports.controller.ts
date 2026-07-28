import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Business - Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('financial')
  @ApiOperation({ summary: 'Get Profit & Loss financial series and aggregates' })
  getFinancialReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getFinancialReport(startDate, endDate);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Get inventory asset valuation and alerts metrics' })
  getInventoryReport() {
    return this.reportsService.getInventoryReport();
  }

  @Get('delivery')
  @ApiOperation({ summary: 'Get delivery success rates and runs logs' })
  getDeliveryReport() {
    return this.reportsService.getDeliveryReport();
  }
}
