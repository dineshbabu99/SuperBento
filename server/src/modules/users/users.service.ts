import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, AssignRoleDto, UserFilterDto } from './dto/user.dto';
import { createPaginatedResponse } from '../../common/dto/pagination.dto';
import { Prisma, UserStatus } from '@prisma/client';

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phoneNumber: true,
  avatarUrl: true,
  status: true,
  isEmailVerified: true,
  lastLoginAt: true,
  roleId: true,
  branchId: true,
  createdAt: true,
  updatedAt: true,
  role: {
    select: { id: true, name: true, slug: true },
  },
  branch: {
    select: { id: true, name: true, code: true },
  },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── CREATE ───────────────────────────────────────────
  async create(dto: CreateUserDto, createdById: string) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    if (dto.roleId) {
      const role = await this.prisma.role.findFirst({ where: { id: dto.roleId, deletedAt: null } });
      if (!role) throw new BadRequestException('Invalid role specified');
    }

    if (dto.branchId) {
      const branch = await this.prisma.branch.findFirst({ where: { id: dto.branchId, deletedAt: null } });
      if (!branch) throw new BadRequestException('Invalid branch specified');
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
        passwordHash,
        roleId: dto.roleId,
        branchId: dto.branchId,
        createdBy: createdById,
        updatedBy: createdById,
      },
      select: USER_SELECT,
    });

    return user;
  }

  // ─── FIND ALL (paginated, filtered, searched) ─────────
  async findAll(filters: UserFilterDto) {
    const { page, limit, search, sortBy = 'createdAt', sortOrder = 'desc', status, roleId, branchId } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(roleId && { roleId }),
      ...(branchId && { branchId }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phoneNumber: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.user.count({ where }),
    ]);

    return createPaginatedResponse(users, total, page, limit);
  }

  // ─── FIND ONE ─────────────────────────────────────────
  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ─── UPDATE ───────────────────────────────────────────
  async update(id: string, dto: UpdateUserDto, updatedById: string) {
    await this.findOne(id); // Ensure exists

    if (dto.roleId) {
      const role = await this.prisma.role.findFirst({ where: { id: dto.roleId, deletedAt: null } });
      if (!role) throw new BadRequestException('Invalid role specified');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.roleId !== undefined && { roleId: dto.roleId }),
        ...(dto.branchId !== undefined && { branchId: dto.branchId }),
        ...(dto.status !== undefined && { status: dto.status }),
        updatedBy: updatedById,
      },
      select: USER_SELECT,
    });

    return user;
  }

  // ─── DEACTIVATE ───────────────────────────────────────
  async deactivate(id: string, updatedById: string) {
    const user = await this.findOne(id);
    if (user.id === updatedById) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.INACTIVE, updatedBy: updatedById },
      select: USER_SELECT,
    });
  }

  // ─── ACTIVATE ─────────────────────────────────────────
  async activate(id: string, updatedById: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.ACTIVE, updatedBy: updatedById },
      select: USER_SELECT,
    });
  }

  // ─── SOFT DELETE ──────────────────────────────────────
  async remove(id: string, deletedById: string) {
    const user = await this.findOne(id);
    if (user.id === deletedById) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: deletedById },
    });

    return { message: 'User deleted successfully' };
  }

  // ─── ASSIGN ROLE ──────────────────────────────────────
  async assignRole(id: string, dto: AssignRoleDto, updatedById: string) {
    await this.findOne(id);
    const role = await this.prisma.role.findFirst({ where: { id: dto.roleId, deletedAt: null } });
    if (!role) throw new BadRequestException('Invalid role specified');

    return this.prisma.user.update({
      where: { id },
      data: { roleId: dto.roleId, updatedBy: updatedById },
      select: USER_SELECT,
    });
  }

  // ─── AUDIT LOGS FOR USER ──────────────────────────────
  async getAuditLogs(userId: string, page: number = 1, limit: number = 20) {
    await this.findOne(userId);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { entityId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          actor: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where: { entityId: userId } }),
    ]);

    return createPaginatedResponse(logs, total, page, limit);
  }

  // ─── STATS ────────────────────────────────────────────
  async getStats() {
    const [total, active, inactive, newThisMonth] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, status: UserStatus.ACTIVE } }),
      this.prisma.user.count({ where: { deletedAt: null, status: UserStatus.INACTIVE } }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
    ]);

    return { total, active, inactive, newThisMonth };
  }
}
