import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  UpdateProfileDto,
  RefreshTokenDto,
} from './dto/auth.dto';
import { JwtPayload, RefreshTokenPayload } from '../../common/types/jwt.types';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ─── LOGIN ────────────────────────────────────────────
  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), deletedAt: null },
      include: {
        role: {
          include: { permissions: { include: { permission: true } } },
        },
      },
    });

    if (!user) {
      // Timing-safe: still verify to prevent enumeration
      await argon2.verify('$argon2id$v=19$m=65536,t=3,p=4$fake', 'fake');
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Your account has been deactivated. Contact your administrator.');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create token family for refresh token rotation
    const family = uuidv4();
    const tokens = await this.generateTokenPair(user.id, user.email, user.roleId, user.role?.slug ?? null, family);

    // Store hashed refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken, family, ipAddress, userAgent);

    // Audit log
    await this.createAuditLog(user.id, AuditAction.LOGIN, 'Auth', user.id, ipAddress, userAgent);

    const permissions = user.role?.permissions.map((rp) => rp.permission.name) ?? [];

    return {
      user: this.sanitizeUser(user),
      permissions,
      ...tokens,
    };
  }

  // ─── REFRESH TOKEN ────────────────────────────────────
  async refreshToken(dto: RefreshTokenDto, ipAddress?: string, userAgent?: string) {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(dto.refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenHash = this.hashToken(dto.refreshToken);

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: { userId: payload.sub, tokenFamily: payload.family, isRevoked: false },
    });

    if (!storedToken) {
      // Token family may have been used before — revoke all tokens in family (reuse attack)
      await this.prisma.refreshToken.updateMany({
        where: { userId: payload.sub, tokenFamily: payload.family },
        data: { isRevoked: true, revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token reuse detected. All sessions revoked.');
    }

    // Verify hash matches
    if (storedToken.tokenHash !== tokenHash) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: payload.sub, tokenFamily: payload.family },
        data: { isRevoked: true, revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token mismatch. All sessions revoked.');
    }

    // Check expiry
    if (new Date() > storedToken.expiresAt) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true, revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    // Get user for new token
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      include: { role: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Issue new token pair (same family for rotation chain)
    const tokens = await this.generateTokenPair(user.id, user.email, user.roleId, user.role?.slug ?? null, payload.family);
    await this.storeRefreshToken(user.id, tokens.refreshToken, payload.family, ipAddress, userAgent);

    return tokens;
  }

  // ─── LOGOUT ───────────────────────────────────────────
  async logout(userId: string, refreshToken?: string, ipAddress?: string, userAgent?: string) {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { userId, tokenHash },
        data: { isRevoked: true, revokedAt: new Date() },
      });
    } else {
      // Logout all sessions
      await this.prisma.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      });
    }

    await this.createAuditLog(userId, AuditAction.LOGOUT, 'Auth', userId, ipAddress, userAgent);
    return { message: 'Logged out successfully' };
  }

  // ─── FORGOT PASSWORD ──────────────────────────────────
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), deletedAt: null },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If that email exists, a reset link has been sent' };
    }

    // Invalidate existing tokens
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const rawToken = uuidv4();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // TODO: Send email via MailService (Phase 1 stub)
    this.logger.log(`Password reset token for ${user.email}: ${rawToken}`);

    return { message: 'If that email exists, a reset link has been sent' };
  }

  // ─── RESET PASSWORD ───────────────────────────────────
  async resetPassword(dto: ResetPasswordDto, ipAddress?: string) {
    const tokenHash = this.hashToken(dto.token);

    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null },
      include: { user: true },
    });

    if (!resetToken || new Date() > resetToken.expiresAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await argon2.hash(dto.password);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all refresh tokens on password reset
      this.prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      }),
    ]);

    await this.createAuditLog(resetToken.userId, AuditAction.PASSWORD_RESET, 'User', resetToken.userId, ipAddress);

    return { message: 'Password reset successfully. Please log in with your new password.' };
  }

  // ─── CHANGE PASSWORD ──────────────────────────────────
  async changePassword(userId: string, dto: ChangePasswordDto, ipAddress?: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) throw new NotFoundException('User not found');

    const isCurrentValid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!isCurrentValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const passwordHash = await argon2.hash(dto.newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      // Revoke all other refresh tokens
      this.prisma.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      }),
    ]);

    await this.createAuditLog(userId, AuditAction.PASSWORD_CHANGE, 'User', userId, ipAddress);

    return { message: 'Password changed successfully. Please log in again.' };
  }

  // ─── GET PROFILE ──────────────────────────────────────
  async getProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        role: {
          include: { permissions: { include: { permission: true } } },
        },
        branch: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const permissions = user.role?.permissions.map((rp) => rp.permission.name) ?? [];

    return {
      ...this.sanitizeUser(user),
      role: user.role
        ? { id: user.role.id, name: user.role.name, slug: user.role.slug }
        : null,
      branch: user.branch
        ? { id: user.branch.id, name: user.branch.name, code: user.branch.code }
        : null,
      permissions,
    };
  }

  // ─── UPDATE PROFILE ───────────────────────────────────
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.phoneNumber && { phoneNumber: dto.phoneNumber }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        updatedBy: userId,
      },
    });

    return this.sanitizeUser(user);
  }

  // ─── HELPERS ──────────────────────────────────────────
  private async generateTokenPair(
    userId: string,
    email: string,
    roleId: string | null,
    roleSlug: string | null,
    family: string,
  ) {
    const accessPayload: JwtPayload = { sub: userId, email, roleId, roleSlug };
    const refreshPayload: RefreshTokenPayload = { sub: userId, family };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessExpiry') as any,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshExpiry') as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(
    userId: string,
    token: string,
    family: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenFamily: family,
        tokenHash,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string | null;
    avatarUrl?: string | null;
    status: string;
    isEmailVerified: boolean;
    lastLoginAt?: Date | null;
    roleId?: string | null;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      phoneNumber: user.phoneNumber,
      avatarUrl: user.avatarUrl,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt,
      roleId: user.roleId,
      createdAt: user.createdAt,
    };
  }

  private async createAuditLog(
    userId: string,
    action: AuditAction,
    entity: string,
    entityId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: { userId, action, entity, entityId, ipAddress, userAgent },
      });
    } catch (e) {
      this.logger.warn('Failed to create audit log', e);
    }
  }
}
