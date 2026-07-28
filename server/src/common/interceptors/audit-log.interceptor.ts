import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { SKIP_AUDIT_KEY } from '../decorators/auth.decorators';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skipAudit = this.reflector.getAllAndOverride<boolean>(SKIP_AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipAudit) return next.handle();

    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const user = request.user;

    // Only audit mutation methods
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: async (response) => {
          if (!user) return;

          try {
            const action = this.resolveAction(method, request.url);
            if (!action) return;

            const data = response as Record<string, unknown> | null;
            const entity = this.resolveEntity(request.url);
            const entityId = (data as Record<string, unknown>)?.id as string | undefined;

            await this.prisma.auditLog.create({
              data: {
                userId: user.id,
                action,
                entity,
                entityId: entityId || undefined,
                newValues: data ? ({ ...data } as any) : undefined,
                ipAddress: request.ip,
                userAgent: request.headers['user-agent'],
              },
            });
          } catch (err) {
            this.logger.warn('Failed to write audit log', err);
          }
        },
      }),
    );
  }

  private resolveAction(method: string, url: string): AuditAction | null {
    if (url.includes('/deactivate')) return AuditAction.DEACTIVATED;
    if (url.includes('/activate')) return AuditAction.ACTIVATED;
    if (url.includes('/change-password')) return AuditAction.PASSWORD_CHANGE;
    if (url.includes('/reset-password')) return AuditAction.PASSWORD_RESET;
    if (url.includes('/role')) return AuditAction.ROLE_ASSIGNED;
    if (url.includes('/permissions')) return AuditAction.PERMISSION_CHANGED;
    switch (method) {
      case 'POST': return AuditAction.CREATE;
      case 'PATCH':
      case 'PUT': return AuditAction.UPDATE;
      case 'DELETE': return AuditAction.DELETE;
      default: return null;
    }
  }

  private resolveEntity(url: string): string {
    const segments = url.split('/').filter(Boolean);
    // api/v1/users → 'User'
    const entitySegments: Record<string, string> = {
      users: 'User',
      roles: 'Role',
      permissions: 'Permission',
      notifications: 'Notification',
      auth: 'Auth',
    };
    for (const seg of segments) {
      if (entitySegments[seg]) return entitySegments[seg];
    }
    return 'Unknown';
  }
}
