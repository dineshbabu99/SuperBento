import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: { dailyMenuId?: string; status?: string }) {
    return this.prisma.prepTask.findMany({
      where: {
        ...(params?.dailyMenuId && { dailyMenuId: params.dailyMenuId }),
        ...(params?.status && { status: params.status as any }),
      },
      orderBy: { createdAt: 'asc' },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        dailyMenu: { select: { id: true, date: true } },
      },
    });
  }

  async updateStatus(id: string, status: string) {
    const task = await this.prisma.prepTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return this.prisma.prepTask.update({
      where: { id },
      data: { status: status as any },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        dailyMenu: { select: { id: true, date: true } },
      },
    });
  }
}

