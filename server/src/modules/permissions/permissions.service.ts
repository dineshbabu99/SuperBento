import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });

    // Group by module
    const grouped = permissions.reduce(
      (acc, perm) => {
        if (!acc[perm.module]) {
          acc[perm.module] = { module: perm.module, permissions: [] };
        }
        acc[perm.module].permissions.push(perm);
        return acc;
      },
      {} as Record<string, { module: string; permissions: typeof permissions }>,
    );

    return Object.values(grouped);
  }
}
