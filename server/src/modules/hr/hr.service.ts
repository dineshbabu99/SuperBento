import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertEmployeeDto } from './dto/upsert-employee.dto';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { PayrollStatus } from '@prisma/client';

@Injectable()
export class HrService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Employees ─────────────────────────────────────────

  async findEmployees() {
    return this.prisma.employeeProfile.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, status: true } },
      },
      orderBy: { designation: 'asc' },
    });
  }

  async findEmployee(id: string) {
    const emp = await this.prisma.employeeProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        payrolls: { orderBy: { payPeriod: 'desc' } },
      },
    });
    if (!emp) throw new NotFoundException(`Employee profile ${id} not found`);
    return emp;
  }

  async upsertEmployee(dto: UpsertEmployeeDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException(`User ${dto.userId} not found`);

    return this.prisma.employeeProfile.upsert({
      where: { userId: dto.userId },
      update: {
        designation: dto.designation,
        department: dto.department,
        monthlySalary: dto.monthlySalary,
        joiningDate: new Date(dto.joiningDate),
        bankName: dto.bankName,
        bankAccountNumber: dto.bankAccountNumber,
        ifscCode: dto.ifscCode,
      },
      create: {
        userId: dto.userId,
        designation: dto.designation,
        department: dto.department,
        monthlySalary: dto.monthlySalary,
        joiningDate: new Date(dto.joiningDate),
        bankName: dto.bankName,
        bankAccountNumber: dto.bankAccountNumber,
        ifscCode: dto.ifscCode,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  // ── Payroll ───────────────────────────────────────────

  async findPayrolls(payPeriod?: string) {
    return this.prisma.payrollRecord.findMany({
      where: {
        ...(payPeriod && { payPeriod }),
      },
      include: {
        employeeProfile: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { netSalary: 'desc' },
    });
  }

  async generatePayroll(dto: GeneratePayrollDto) {
    const employees = await this.prisma.employeeProfile.findMany({
      where: { isActive: true },
    });

    if (employees.length === 0) {
      throw new BadRequestException('No active employee profiles found to generate payroll');
    }

    const createdRecords = [];

    for (const emp of employees) {
      const existing = await this.prisma.payrollRecord.findUnique({
        where: {
          employeeProfileId_payPeriod: {
            employeeProfileId: emp.id,
            payPeriod: dto.payPeriod,
          },
        },
      });

      if (!existing) {
        const record = await this.prisma.payrollRecord.create({
          data: {
            employeeProfileId: emp.id,
            payPeriod: dto.payPeriod,
            basicSalary: emp.monthlySalary,
            bonus: 0,
            deductions: 0,
            netSalary: emp.monthlySalary, // Initially netSalary = basicSalary
            status: 'DRAFT',
          },
          include: {
            employeeProfile: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
        });
        createdRecords.push(record);
      }
    }

    return {
      message: `Payroll run generated for ${dto.payPeriod}`,
      generatedCount: createdRecords.length,
      records: createdRecords,
    };
  }

  async updatePayrollStatus(
    id: string,
    status: PayrollStatus,
    adjustments?: { bonus?: number; deductions?: number },
    userId?: string,
  ) {
    const record = await this.prisma.payrollRecord.findUnique({
      where: { id },
      include: { employeeProfile: { include: { user: true } } },
    });

    if (!record) throw new NotFoundException(`Payroll record ${id} not found`);

    if (record.status === 'PAID') {
      throw new BadRequestException('Cannot modify status of a paid payroll slip');
    }

    const data: any = { status };

    // Apply adjustments if in DRAFT/APPROVED mode
    if (adjustments) {
      const bonus = adjustments.bonus ?? record.bonus;
      const deductions = adjustments.deductions ?? record.deductions;
      data.bonus = bonus;
      data.deductions = deductions;
      data.netSalary = record.basicSalary + bonus - deductions;
    }

    if (status === 'PAID') {
      // Must disburse and create transaction ledger entry
      return this.prisma.$transaction(async (tx) => {
        // 1. Create finance expense transaction
        const transaction = await tx.transaction.create({
          data: {
            type: 'EXPENSE',
            category: 'SALARY',
            amount: data.netSalary ?? record.netSalary,
            status: 'COMPLETED',
            notes: `Salary payout for ${record.employeeProfile.user.firstName} ${record.employeeProfile.user.lastName} - Period: ${record.payPeriod}`,
            date: new Date(),
            performedById: userId,
          },
        });

        // 2. Update payroll slip
        return tx.payrollRecord.update({
          where: { id },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            transactionId: transaction.id,
            ...(adjustments && data),
          },
          include: {
            employeeProfile: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
        });
      });
    }

    return this.prisma.payrollRecord.update({
      where: { id },
      data,
      include: {
        employeeProfile: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
  }
}
