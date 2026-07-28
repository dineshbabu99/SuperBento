export interface JwtPayload {
  sub: string;       // user id
  email: string;
  roleId: string | null;
  roleSlug: string | null;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  family: string;
  iat?: number;
  exp?: number;
}

export interface RequestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string | null;
  roleSlug: string | null;
  permissions: string[];
}
