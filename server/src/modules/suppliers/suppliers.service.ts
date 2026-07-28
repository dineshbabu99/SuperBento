import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: { search?: string; isActive?: boolean }) {
    return this.prisma.supplier.findMany({
      where: {
        deletedAt: { isSet: false },
        ...(params?.isActive !== undefined && { isActive: params.isActive }),
        ...(params?.search && {
          OR: [
            { name: { contains: params.search, mode: 'insensitive' } },
            { contactPerson: { contains: params.search, mode: 'insensitive' } },
            { email: { contains: params.search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, deletedAt: { isSet: false } },
      include: {
        purchaseOrders: {
          where: { status: { not: 'CANCELLED' } },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            poNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    });
    if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
    return supplier;
  }

  async create(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: dto });
  }

  async update(id: string, dto: UpdateSupplierDto) {
    const supplier = await this.prisma.supplier.findFirst({ where: { id, deletedAt: { isSet: false } } });
    if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const supplier = await this.prisma.supplier.findFirst({ where: { id, deletedAt: { isSet: false } } });
    if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
    return this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
