import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';


@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');

    // Soft-delete middleware
    // Note: this.$use has been removed in Prisma v5+. 
    // You will need to migrate this logic to Prisma Client Extensions ($extends).
    /*
    (this as any).$use(async (params: any, next: any) => {
      const modelsWithSoftDelete = ['User', 'Role', 'Branch'];

      if (modelsWithSoftDelete.includes(params.model as string)) {
        if (params.action === 'delete') {
          params.action = 'update';
          params.args['data'] = { deletedAt: new Date() };
        }
        if (params.action === 'deleteMany') {
          params.action = 'updateMany';
          if (params.args.data !== undefined) {
            params.args.data['deletedAt'] = new Date();
          } else {
            params.args['data'] = { deletedAt: new Date() };
          }
        }
        // Exclude soft-deleted records from all find queries
        if (params.action === 'findUnique' || params.action === 'findFirst') {
          params.action = 'findFirst';
          params.args.where = {
            ...params.args.where,
            deletedAt: { isSet: false },
          };
        }
        if (params.action === 'findMany') {
          if (params.args.where !== undefined) {
            if (params.args.where.deletedAt === undefined) {
              params.args.where = { ...params.args.where, deletedAt: { isSet: false } };
            }
          } else {
            params.args['where'] = { deletedAt: { isSet: false } };
          }
        }
      }
      return next(params);
    });
    */
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDatabase is only allowed in test environment');
    }
    // Delete all documents from all collections.
    // Replace with specific deleteMany() calls for each model if you want to keep collections intact.
    await this.$runCommandRaw({ dropDatabase: 1 });
  }
}
