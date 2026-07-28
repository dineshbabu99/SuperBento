import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { AddPoItemDto } from './dto/add-po-item.dto';
import { PurchaseOrderStatus } from '@prisma/client';

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  private get includeDetails() {
    return {
      supplier: { select: { id: true, name: true, contactPerson: true } },
      branch: { select: { id: true, name: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      approvedBy: { select: { id: true, firstName: true, lastName: true } },
      items: {
        include: {
          ingredient: { select: { id: true, name: true, unit: true } },
        },
        orderBy: { createdAt: 'asc' as const },
      },
    };
  }

  async findAll(params?: { status?: PurchaseOrderStatus; supplierId?: string; page?: number; limit?: number }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(params?.status && { status: params.status }),
      ...(params?.supplierId && { supplierId: params.supplierId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: this.includeDetails,
    });
    if (!po) throw new NotFoundException(`Purchase order ${id} not found`);
    return po;
  }

  async create(dto: CreatePurchaseOrderDto, userId: string) {
    const poNumber = await this.generatePoNumber();
    return this.prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: dto.supplierId,
        branchId: dto.branchId,
        expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : undefined,
        notes: dto.notes,
        createdById: userId,
        status: 'DRAFT',
      },
      include: this.includeDetails,
    });
  }

  async update(id: string, dto: Partial<CreatePurchaseOrderDto>) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new NotFoundException(`Purchase order ${id} not found`);
    if (po.status !== 'DRAFT') throw new BadRequestException('Only DRAFT orders can be edited');

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        ...(dto.supplierId && { supplierId: dto.supplierId }),
        ...(dto.branchId !== undefined && { branchId: dto.branchId }),
        ...(dto.expectedDeliveryDate && { expectedDeliveryDate: new Date(dto.expectedDeliveryDate) }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: this.includeDetails,
    });
  }

  async submit(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!po) throw new NotFoundException(`Purchase order ${id} not found`);
    if (po.status !== 'DRAFT') throw new BadRequestException('Only DRAFT orders can be submitted');
    if (po.items.length === 0) throw new BadRequestException('Cannot submit PO with no items');

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'SUBMITTED' },
      include: this.includeDetails,
    });
  }

  async approve(id: string, userId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new NotFoundException(`Purchase order ${id} not found`);
    if (po.status !== 'SUBMITTED') throw new BadRequestException('Only SUBMITTED orders can be approved');

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'APPROVED', approvedById: userId, approvedAt: new Date() },
      include: this.includeDetails,
    });
  }

  async receive(id: string, userId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: { include: { ingredient: true } } },
    });
    if (!po) throw new NotFoundException(`Purchase order ${id} not found`);
    if (po.status !== 'APPROVED') throw new BadRequestException('Only APPROVED orders can be received');

    // Update inventory for each line item
    await this.prisma.$transaction(async (tx) => {
      for (const item of po.items) {
        const invItem = await tx.inventoryItem.findFirst({
          where: { ingredientId: item.ingredientId, branchId: po.branchId ?? null },
        });

        if (invItem) {
          await tx.inventoryItem.update({
            where: { id: invItem.id },
            data: { currentStock: { increment: item.quantity }, lastUpdatedAt: new Date() },
          });
          await tx.stockMovement.create({
            data: {
              inventoryItemId: invItem.id,
              type: 'PURCHASE_RECEIPT',
              quantity: item.quantity,
              note: `PO received: ${po.poNumber}`,
              referenceId: po.id,
              performedById: userId,
            },
          });
          // Update received quantity on line item
          await tx.purchaseOrderItem.update({
            where: { id: item.id },
            data: { receivedQuantity: item.quantity },
          });
        }
      }

      await tx.purchaseOrder.update({
        where: { id },
        data: { status: 'RECEIVED' },
      });
    });

    return this.findOne(id);
  }

  async cancel(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new NotFoundException(`Purchase order ${id} not found`);
    if (po.status === 'RECEIVED') throw new BadRequestException('Received orders cannot be cancelled');

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: this.includeDetails,
    });
  }

  async addItem(poId: string, dto: AddPoItemDto) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: true },
    });
    if (!po) throw new NotFoundException(`Purchase order ${poId} not found`);
    if (!['DRAFT', 'SUBMITTED'].includes(po.status)) {
      throw new BadRequestException('Items can only be added to DRAFT or SUBMITTED orders');
    }

    const totalPrice = dto.quantity * dto.unitPrice;

    const item = await this.prisma.purchaseOrderItem.create({
      data: {
        purchaseOrderId: poId,
        ingredientId: dto.ingredientId,
        quantity: dto.quantity,
        unit: dto.unit,
        unitPrice: dto.unitPrice,
        totalPrice,
      },
      include: { ingredient: { select: { id: true, name: true, unit: true } } },
    });

    // Recalculate total
    await this.recalculateTotal(poId);
    return item;
  }

  async removeItem(poId: string, itemId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id: poId } });
    if (!po) throw new NotFoundException(`Purchase order ${poId} not found`);
    if (!['DRAFT', 'SUBMITTED'].includes(po.status)) {
      throw new BadRequestException('Items can only be removed from DRAFT or SUBMITTED orders');
    }

    const item = await this.prisma.purchaseOrderItem.findFirst({
      where: { id: itemId, purchaseOrderId: poId },
    });
    if (!item) throw new NotFoundException(`Item ${itemId} not found`);

    await this.prisma.purchaseOrderItem.delete({ where: { id: itemId } });
    await this.recalculateTotal(poId);
    return { success: true };
  }

  private async recalculateTotal(poId: string) {
    const items = await this.prisma.purchaseOrderItem.findMany({ where: { purchaseOrderId: poId } });
    const total = items.reduce((sum, i) => sum + i.totalPrice, 0);
    await this.prisma.purchaseOrder.update({ where: { id: poId }, data: { totalAmount: total } });
  }

  private async generatePoNumber(): Promise<string> {
    const now = new Date();
    const prefix = `PO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const count = await this.prisma.purchaseOrder.count({
      where: { poNumber: { startsWith: prefix } },
    });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }
}
