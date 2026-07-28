import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Key-Value Settings ────────────────────────────────

  async getSettings() {
    const settings = await this.prisma.systemSetting.findMany();
    return settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
  }

  async updateSettings(settings: Record<string, string>) {
    await this.prisma.$transaction(
      Object.entries(settings).map(([key, value]) =>
        this.prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    );
    return this.getSettings();
  }

  // ── Branches ─────────────────────────────────────────

  async findBranches() {
    return this.prisma.branch.findMany({
      where: { deletedAt: { isSet: false } },
      orderBy: { name: 'asc' },
    });
  }

  async createBranch(dto: CreateBranchDto, userId: string) {
    const existing = await this.prisma.branch.findFirst({
      where: { code: dto.code, deletedAt: { isSet: false } },
    });
    if (existing) throw new ConflictException(`Branch code ${dto.code} already exists`);

    return this.prisma.branch.create({
      data: {
        name: dto.name,
        code: dto.code,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        phone: dto.phone,
        email: dto.email,
        isActive: dto.isActive ?? true,
        createdBy: userId,
      },
    });
  }

  async updateBranch(id: string, dto: Partial<CreateBranchDto>, userId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, deletedAt: { isSet: false } },
    });
    if (!branch) throw new NotFoundException(`Branch ${id} not found`);

    if (dto.code && dto.code !== branch.code) {
      const codeExists = await this.prisma.branch.findFirst({
        where: { code: dto.code, deletedAt: { isSet: false } },
      });
      if (codeExists) throw new ConflictException(`Branch code ${dto.code} is already in use`);
    }

    return this.prisma.branch.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });
  }

  async removeBranch(id: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, deletedAt: { isSet: false } },
    });
    if (!branch) throw new NotFoundException(`Branch ${id} not found`);

    return this.prisma.branch.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
