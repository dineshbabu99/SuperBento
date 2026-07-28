import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.ingredient.findMany({
      where: { deletedAt: { isSet: false } },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateIngredientDto) {
    return this.prisma.ingredient.create({ data: dto });
  }

  async update(id: string, dto: Partial<CreateIngredientDto>) {
    const ingredient = await this.prisma.ingredient.findUnique({ where: { id } });
    if (!ingredient) throw new NotFoundException(`Ingredient ${id} not found`);
    return this.prisma.ingredient.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const ingredient = await this.prisma.ingredient.findUnique({ where: { id } });
    if (!ingredient) throw new NotFoundException(`Ingredient ${id} not found`);
    // Soft delete
    return this.prisma.ingredient.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

