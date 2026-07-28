import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: { branchId?: string; search?: string }) {
    const items = await this.prisma.inventoryItem.findMany({
      where: {
        ...(params?.branchId && { branchId: params.branchId }),
        ...(params?.search && {
          ingredient: { name: { contains: params.search, mode: 'insensitive' } },
        }),
      },
      include: {
        ingredient: { select: { id: true, name: true, unit: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { ingredient: { name: 'asc' } },
    });

    return items.map((item) => ({
      ...item,
      stockStatus: this.computeStatus(item.currentStock, item.minStockLevel),
    }));
  }

  async findOne(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        ingredient: { select: { id: true, name: true, unit: true } },
        branch: { select: { id: true, name: true } },
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            performedBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!item) throw new NotFoundException(`Inventory item ${id} not found`);
    return { ...item, stockStatus: this.computeStatus(item.currentStock, item.minStockLevel) };
  }

  async create(dto: CreateInventoryItemDto) {
    const existing = await this.prisma.inventoryItem.findFirst({
      where: {
        ingredientId: dto.ingredientId,
        branchId: dto.branchId ?? null,
      },
    });
    if (existing) {
      throw new ConflictException('Inventory item for this ingredient and branch already exists');
    }
    return this.prisma.inventoryItem.create({
      data: {
        ingredientId: dto.ingredientId,
        branchId: dto.branchId,
        currentStock: dto.currentStock ?? 0,
        minStockLevel: dto.minStockLevel ?? 0,
        unit: dto.unit,
      },
      include: {
        ingredient: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, dto: Partial<{ minStockLevel: number; unit: string }>) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Inventory item ${id} not found`);
    return this.prisma.inventoryItem.update({ where: { id }, data: dto });
  }

  async adjustStock(id: string, dto: AdjustStockDto, userId: string) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Inventory item ${id} not found`);

    const newStock = item.currentStock + dto.quantity;

    const [updatedItem] = await this.prisma.$transaction([
      this.prisma.inventoryItem.update({
        where: { id },
        data: { currentStock: newStock, lastUpdatedAt: new Date() },
        include: { ingredient: { select: { id: true, name: true } } },
      }),
      this.prisma.stockMovement.create({
        data: {
          inventoryItemId: id,
          type: dto.type,
          quantity: dto.quantity,
          note: dto.note,
          referenceId: dto.referenceId,
          performedById: userId,
        },
      }),
    ]);

    return { ...updatedItem, stockStatus: this.computeStatus(newStock, item.minStockLevel) };
  }

  async getLowStockAlerts(branchId?: string) {
    const items = await this.prisma.inventoryItem.findMany({
      where: {
        ...(branchId && { branchId }),
      },
      include: {
        ingredient: { select: { id: true, name: true, unit: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    return items
      .filter((item) => item.currentStock <= item.minStockLevel)
      .map((item) => ({
        ...item,
        stockStatus: this.computeStatus(item.currentStock, item.minStockLevel),
      }))
      .sort((a, b) => a.currentStock - b.currentStock);
  }

  private computeStatus(current: number, min: number): 'OK' | 'LOW' | 'CRITICAL' {
    if (current <= 0) return 'CRITICAL';
    if (current <= min) return 'LOW';
    return 'OK';
  }
}
