import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto, UpdateRolePermissionsDto } from './dto/role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const roles = await this.prisma.role.findMany({
      where: { deletedAt: { isSet: false } },
      include: {
        _count: { select: { users: true, permissions: true } },
        permissions: {
          include: { permission: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((role) => ({
      ...role,
      userCount: role._count.users,
      permissionCount: role._count.permissions,
      permissions: role.permissions.map((rp) => rp.permission),
      _count: undefined,
    }));
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, deletedAt: { isSet: false } },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });

    if (!role) throw new NotFoundException('Role not found');

    return {
      ...role,
      userCount: role._count.users,
      permissions: role.permissions.map((rp) => rp.permission),
      _count: undefined,
    };
  }

  async create(dto: CreateRoleDto, createdById: string) {
    const existing = await this.prisma.role.findFirst({
      where: { OR: [{ name: dto.name }, { slug: dto.slug }], deletedAt: { isSet: false } },
    });
    if (existing) {
      throw new ConflictException('A role with this name or slug already exists');
    }

    return this.prisma.role.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        isSystem: false,
        createdBy: createdById,
        updatedBy: createdById,
      },
    });
  }

  async update(id: string, dto: UpdateRoleDto, updatedById: string) {
    const role = await this.findOne(id);
    if (role.isSystem) {
      throw new ForbiddenException('System roles cannot be modified');
    }

    if (dto.slug && dto.slug !== role.slug) {
      const existing = await this.prisma.role.findFirst({
        where: { slug: dto.slug, deletedAt: { isSet: false }, NOT: { id } },
      });
      if (existing) throw new ConflictException('A role with this slug already exists');
    }

    return this.prisma.role.update({
      where: { id },
      data: { ...dto, updatedBy: updatedById },
    });
  }

  async remove(id: string) {
    const role = await this.findOne(id);
    if (role.isSystem) {
      throw new ForbiddenException('System roles cannot be deleted');
    }
    if (role.userCount > 0) {
      throw new BadRequestException(
        `Cannot delete role with ${role.userCount} assigned user(s). Reassign users first.`,
      );
    }

    await this.prisma.role.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Role deleted successfully' };
  }

  async updatePermissions(id: string, dto: UpdateRolePermissionsDto, updatedById: string) {
    const role = await this.findOne(id);
    if (role.isSystem && role.slug === 'super-admin') {
      throw new ForbiddenException('Super Admin permissions cannot be modified');
    }

    // Validate all permission IDs exist
    if (dto.permissionIds.length > 0) {
      const permissions = await this.prisma.permission.findMany({
        where: { id: { in: dto.permissionIds } },
      });
      if (permissions.length !== dto.permissionIds.length) {
        throw new BadRequestException('One or more permission IDs are invalid');
      }
    }

    // Replace all permissions atomically
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      ...(dto.permissionIds.length > 0
        ? [
            this.prisma.rolePermission.createMany({
              data: dto.permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
            }),
          ]
        : []),
      this.prisma.role.update({ where: { id }, data: { updatedBy: updatedById } }),
    ]);

    return this.findOne(id);
  }
}
