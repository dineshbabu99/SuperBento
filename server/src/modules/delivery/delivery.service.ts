import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeliveryBatchDto } from './dto/create-delivery-batch.dto';
import { UpdateStopStatusDto } from './dto/update-stop-status.dto';
import { DeliveryStatus } from '@prisma/client';

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  private get batchIncludes() {
    return {
      dailyMenu: { select: { id: true, date: true } },
      branch: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
      stops: { orderBy: { sortOrder: 'asc' as const } },
      _count: { select: { stops: true } },
    };
  }

  async findBatches(params?: { status?: DeliveryStatus; branchId?: string; page?: number; limit?: number }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(params?.status && { status: params.status }),
      ...(params?.branchId && { branchId: params.branchId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.deliveryBatch.findMany({
        where,
        include: {
          branch: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          dailyMenu: { select: { id: true, date: true } },
          _count: { select: { stops: true } },
        },
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.deliveryBatch.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findBatch(id: string) {
    const batch = await this.prisma.deliveryBatch.findUnique({
      where: { id },
      include: this.batchIncludes,
    });
    if (!batch) throw new NotFoundException(`Delivery batch ${id} not found`);

    const stopSummary = {
      total: batch.stops.length,
      delivered: batch.stops.filter((s) => s.status === 'DELIVERED').length,
      failed: batch.stops.filter((s) => s.status === 'FAILED').length,
      pending: batch.stops.filter((s) => s.status === 'PENDING').length,
    };

    return { ...batch, stopSummary };
  }

  async createBatch(dto: CreateDeliveryBatchDto) {
    const batchNumber = await this.generateBatchNumber();

    return this.prisma.deliveryBatch.create({
      data: {
        batchNumber,
        dailyMenuId: dto.dailyMenuId,
        branchId: dto.branchId,
        assignedToId: dto.assignedToId,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        notes: dto.notes,
        status: dto.assignedToId ? 'ASSIGNED' : 'PENDING',
        stops: dto.stops
          ? {
              create: dto.stops.map((stop, idx) => ({
                customerName: stop.customerName,
                address: stop.address,
                phone: stop.phone,
                sortOrder: stop.sortOrder ?? idx,
              })),
            }
          : undefined,
      },
      include: this.batchIncludes,
    });
  }

  async updateBatchStatus(id: string, status: DeliveryStatus) {
    const batch = await this.prisma.deliveryBatch.findUnique({ where: { id } });
    if (!batch) throw new NotFoundException(`Delivery batch ${id} not found`);

    const validTransitions: Record<string, DeliveryStatus[]> = {
      PENDING: ['ASSIGNED', 'CANCELLED' as any],
      ASSIGNED: ['IN_TRANSIT', 'PENDING'],
      IN_TRANSIT: ['DELIVERED', 'FAILED'],
    };
    const allowed = validTransitions[batch.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${batch.status} to ${status}`);
    }

    const data: any = { status };
    if (status === 'IN_TRANSIT') data.startedAt = new Date();
    if (status === 'DELIVERED' || status === 'FAILED') data.completedAt = new Date();

    return this.prisma.deliveryBatch.update({
      where: { id },
      data,
      include: this.batchIncludes,
    });
  }

  async updateStopStatus(batchId: string, stopId: string, dto: UpdateStopStatusDto) {
    const stop = await this.prisma.deliveryStop.findFirst({
      where: { id: stopId, deliveryBatchId: batchId },
    });
    if (!stop) throw new NotFoundException(`Stop ${stopId} not found`);

    const data: any = { status: dto.status };
    if (dto.status === 'DELIVERED') data.deliveredAt = new Date();
    if (dto.status === 'FAILED') data.failureReason = dto.failureReason ?? null;

    return this.prisma.deliveryStop.update({ where: { id: stopId }, data });
  }

  private async generateBatchNumber(): Promise<string> {
    const now = new Date();
    const prefix = `DB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const count = await this.prisma.deliveryBatch.count({
      where: { batchNumber: { startsWith: prefix } },
    });
    return `${prefix}-${String(count + 1).padStart(3, '0')}`;
  }
}
