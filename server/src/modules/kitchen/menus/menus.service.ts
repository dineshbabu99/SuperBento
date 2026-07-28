import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: { date?: string; branchId?: string }) {
    return this.prisma.dailyMenu.findMany({
      where: {
        ...(params?.branchId && { branchId: params.branchId }),
        ...(params?.date && { date: new Date(params.date) }),
      },
      orderBy: { date: 'desc' },
      include: {
        items: {
          include: { recipe: { select: { id: true, name: true } } },
        },
        branch: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(id: string) {
    const menu = await this.prisma.dailyMenu.findUnique({
      where: { id },
      include: {
        items: {
          include: { recipe: { select: { id: true, name: true, category: true } } },
        },
        prepTasks: {
          include: {
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        branch: { select: { id: true, name: true } },
      },
    });
    if (!menu) throw new NotFoundException(`Menu ${id} not found`);
    return menu;
  }

  async create(dto: CreateMenuDto) {
    return this.prisma.dailyMenu.create({
      data: {
        date: new Date(dto.date),
        branchId: dto.branchId,
        status: dto.status ?? 'DRAFT',
      },
      include: {
        items: true,
        branch: { select: { id: true, name: true } },
      },
    });
  }

  async updateStatus(id: string, status: string) {
    const menu = await this.prisma.dailyMenu.findUnique({ where: { id } });
    if (!menu) throw new NotFoundException(`Menu ${id} not found`);
    return this.prisma.dailyMenu.update({ where: { id }, data: { status: status as any } });
  }

  async addMenuItem(menuId: string, dto: { recipeId: string; mealType: string; targetQuantity?: number }) {
    const menu = await this.prisma.dailyMenu.findUnique({ where: { id: menuId } });
    if (!menu) throw new NotFoundException(`Menu ${menuId} not found`);
    const recipe = await this.prisma.recipe.findUnique({ where: { id: dto.recipeId } });
    if (!recipe) throw new NotFoundException(`Recipe ${dto.recipeId} not found`);

    const item = await this.prisma.menuItem.create({
      data: {
        dailyMenuId: menuId,
        recipeId: dto.recipeId,
        mealType: dto.mealType as any,
        targetQuantity: dto.targetQuantity ?? 1,
      },
      include: { recipe: { select: { id: true, name: true, category: true } } },
    });
    return item;
  }

  async removeMenuItem(menuId: string, itemId: string) {
    const item = await this.prisma.menuItem.findFirst({ where: { id: itemId, dailyMenuId: menuId } });
    if (!item) throw new NotFoundException(`Menu item ${itemId} not found`);
    return this.prisma.menuItem.delete({ where: { id: itemId } });
  }
}

