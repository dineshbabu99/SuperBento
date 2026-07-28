import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFinancialReport(startDate?: string, endDate?: string) {
    const filter = {
      status: 'COMPLETED' as const,
      ...((startDate || endDate) && {
        date: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      }),
    };

    const transactions = await this.prisma.transaction.findMany({
      where: filter,
      orderBy: { date: 'asc' },
    });

    // 1. Group daily stats for Area chart series
    const dailyMap = new Map<string, { date: string; revenue: number; expenses: number }>();
    
    transactions.forEach((tx) => {
      const dateStr = tx.date.toISOString().split('T')[0];
      const existing = dailyMap.get(dateStr) || { date: dateStr, revenue: 0, expenses: 0 };
      
      if (tx.type === 'INCOME') {
        existing.revenue += tx.amount;
      } else {
        existing.expenses += tx.amount;
      }
      dailyMap.set(dateStr, existing);
    });

    const series = Array.from(dailyMap.values());

    // 2. Breakdown expenses by category for Pie chart
    const expenseBreakdownMap = new Map<string, number>();
    transactions
      .filter((t) => t.type === 'EXPENSE')
      .forEach((tx) => {
        const cat = tx.category;
        const existing = expenseBreakdownMap.get(cat) || 0;
        expenseBreakdownMap.set(cat, existing + tx.amount);
      });

    const categoriesBreakdown = Array.from(expenseBreakdownMap.entries()).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value,
    }));

    return {
      series,
      categoriesBreakdown,
      totals: {
        totalRevenue: transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0),
        totalExpenses: transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0),
      },
    };
  }

  async getInventoryReport() {
    const items = await this.prisma.inventoryItem.findMany({
      include: { ingredient: true },
    });

    // Calculate valuation (currentStock * defaultCost)
    let totalValuation = 0;
    const itemsValuation = items.map((item) => {
      const cost = item.ingredient.defaultCost ?? 0;
      const value = item.currentStock * cost;
      totalValuation += value;
      return {
        id: item.id,
        ingredientName: item.ingredient.name,
        currentStock: item.currentStock,
        unit: item.unit,
        defaultCost: cost,
        value,
      };
    });

    const lowStockCount = items.filter((i) => i.currentStock <= i.minStockLevel).length;

    return {
      totalValuation,
      lowStockCount,
      items: itemsValuation.sort((a, b) => b.value - a.value).slice(0, 10), // Top 10 by value
    };
  }

  async getDeliveryReport() {
    const batches = await this.prisma.deliveryBatch.findMany({
      include: {
        stops: true,
      },
    });

    const totalRuns = batches.length;
    const completedRuns = batches.filter((b) => b.status === 'DELIVERED').length;
    const failedRuns = batches.filter((b) => b.status === 'FAILED').length;

    // Stops summary
    let totalStops = 0;
    let deliveredStops = 0;
    let failedStops = 0;

    batches.forEach((b) => {
      b.stops.forEach((s) => {
        totalStops++;
        if (s.status === 'DELIVERED') deliveredStops++;
        if (s.status === 'FAILED') failedStops++;
      });
    });

    const successRate = totalStops > 0 ? Math.round((deliveredStops / totalStops) * 100) : 100;

    return {
      totalRuns,
      completedRuns,
      failedRuns,
      stopsSummary: {
        totalStops,
        deliveredStops,
        failedStops,
        successRate,
      },
    };
  }
}
