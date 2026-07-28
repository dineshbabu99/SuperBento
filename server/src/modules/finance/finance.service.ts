import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionType, TransactionCategory } from '@prisma/client';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: {
    type?: TransactionType;
    category?: TransactionCategory;
    startDate?: string;
    endDate?: string;
  }) {
    return this.prisma.transaction.findMany({
      where: {
        ...(params?.type && { type: params.type }),
        ...(params?.category && { category: params.category }),
        ...((params?.startDate || params?.endDate) && {
          date: {
            ...(params?.startDate && { gte: new Date(params.startDate) }),
            ...(params?.endDate && { lte: new Date(params.endDate) }),
          },
        }),
      },
      include: {
        performedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        performedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!tx) throw new NotFoundException(`Transaction ${id} not found`);
    return tx;
  }

  async create(dto: CreateTransactionDto, userId: string) {
    return this.prisma.transaction.create({
      data: {
        type: dto.type,
        category: dto.category,
        amount: dto.amount,
        notes: dto.notes,
        performedById: userId,
      },
      include: {
        performedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async getSummary() {
    const transactions = await this.prisma.transaction.findMany({
      where: { status: 'COMPLETED' },
    });

    const income = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expense,
      net: income - expense,
    };
  }
}
