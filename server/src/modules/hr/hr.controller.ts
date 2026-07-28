import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HrService } from './hr.service';
import { UpsertEmployeeDto } from './dto/upsert-employee.dto';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PayrollStatus } from '@prisma/client';

@ApiTags('Business - HR')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  // ── Employees ─────────────────────────────────────────

  @Get('employees')
  @ApiOperation({ summary: 'List all employee profiles' })
  findEmployees() {
    return this.hrService.findEmployees();
  }

  @Get('employees/:id')
  @ApiOperation({ summary: 'Get employee profile detail' })
  findEmployee(@Param('id') id: string) {
    return this.hrService.findEmployee(id);
  }

  @Post('employees')
  @ApiOperation({ summary: 'Create or update an employee profile' })
  upsertEmployee(@Body() dto: UpsertEmployeeDto) {
    return this.hrService.upsertEmployee(dto);
  }

  // ── Payroll ───────────────────────────────────────────

  @Get('payroll')
  @ApiOperation({ summary: 'List payroll runs' })
  findPayrolls(@Query('payPeriod') payPeriod?: string) {
    return this.hrService.findPayrolls(payPeriod);
  }

  @Post('payroll/generate')
  @ApiOperation({ summary: 'Generate payroll drafts for a payPeriod' })
  generatePayroll(@Body() dto: GeneratePayrollDto) {
    return this.hrService.generatePayroll(dto);
  }

  @Patch('payroll/:id/status')
  @ApiOperation({ summary: 'Update payroll slip status (Approve or Mark Paid)' })
  updatePayrollStatus(
    @Param('id') id: string,
    @Body('status') status: PayrollStatus,
    @Body('bonus') bonus?: number,
    @Body('deductions') deductions?: number,
    @Request() req?: any,
  ) {
    const adjustments =
      bonus !== undefined || deductions !== undefined
        ? { bonus, deductions }
        : undefined;

    return this.hrService.updatePayrollStatus(
      id,
      status,
      adjustments,
      req?.user?.id,
    );
  }
}
