# SuperBento ERP — Phase 1 Implementation Plan

## Overview

SuperBento ERP is a **production-grade, enterprise-level ERP system** purpose-built for a Nutrition & Diet Meal Subscription company operating in Tamil Nadu. The architecture mirrors best-in-class systems like SAP Business One, Oracle NetSuite, and Odoo — but tailored to the meal subscription domain.

Phase 1 covers the **foundational pillars** of the ERP: Authentication, User Management, RBAC, Dashboard Shell, and the Design System. Every subsequent phase depends on this foundation.

---

## Architecture

### Overall Pattern: **Monorepo with Clean Architecture**

```
superbento-erp/
├── client/          ← React 19 + Vite + TypeScript (SPA)
├── server/          ← NestJS + Prisma + PostgreSQL (REST + WS)
├── docker-compose.yml
└── README.md
```

### Backend Architecture: **Layered Clean Architecture (NestJS)**

```
Presentation Layer (Controllers, Guards, Interceptors)
     ↓
Application Layer (Services, Use Cases, DTOs)
     ↓
Domain Layer (Entities, Interfaces, Business Rules)
     ↓
Infrastructure Layer (Prisma Repositories, Redis, S3, BullMQ)
```

- **NestJS modules** map 1:1 with domain features (auth, users, roles, permissions)
- **Guards** enforce JWT + RBAC at the route level
- **Interceptors** handle response transformation and audit logging
- **Pipes** handle DTO validation via `class-validator` + `class-transformer`

### Frontend Architecture: **Feature-Sliced Design (FSD)**

```
/src
  /app          ← Root setup: Router, Redux, QueryClient, Themes
  /features     ← Feature modules: auth, users, roles, dashboard
  /entities     ← Business types/models shared across features
  /shared       ← Design System: ui/, hooks/, lib/, utils/, api/
  /pages        ← Route-level page components
  /layouts      ← Shell layouts (AppLayout, AuthLayout)
```

---

## Folder Structure

### Backend (`/server`)

```
server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   ├── configuration.ts
│   │   ├── database.config.ts
│   │   └── jwt.config.ts
│   ├── common/
│   │   ├── decorators/        ← @CurrentUser, @Roles, @Permissions
│   │   ├── guards/            ← JwtAuthGuard, RolesGuard, PermissionsGuard
│   │   ├── interceptors/      ← TransformResponse, AuditLog
│   │   ├── filters/           ← GlobalExceptionFilter
│   │   ├── pipes/             ← ValidationPipe
│   │   ├── dto/               ← PaginationDto, SortDto
│   │   └── types/             ← JwtPayload, RequestWithUser
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/    ← jwt.strategy, refresh.strategy
│   │   │   └── dto/
│   │   ├── users/
│   │   ├── roles/
│   │   ├── permissions/
│   │   └── notifications/
│   └── prisma/
│       ├── prisma.module.ts
│       ├── prisma.service.ts
│       └── schema.prisma
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── test/
├── Dockerfile
├── .env.example
└── package.json
```

### Frontend (`/client`)

```
client/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── app/
│   │   ├── store.ts           ← Redux store
│   │   ├── router.tsx         ← React Router v6 config
│   │   └── providers.tsx      ← QueryClient, Theme, Toast
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/    ← LoginForm, ForgotPasswordForm
│   │   │   ├── hooks/         ← useLogin, useLogout, useAuth
│   │   │   ├── store/         ← authSlice
│   │   │   ├── api/           ← authApi (RTK Query)
│   │   │   └── pages/         ← LoginPage, ForgotPasswordPage
│   │   ├── users/
│   │   │   ├── components/    ← UserTable, UserForm, UserDrawer
│   │   │   ├── hooks/
│   │   │   ├── api/
│   │   │   └── pages/         ← UsersPage, UserDetailPage
│   │   ├── roles/
│   │   ├── dashboard/
│   │   └── notifications/
│   ├── entities/
│   │   ├── user.ts
│   │   ├── role.ts
│   │   └── permission.ts
│   ├── shared/
│   │   ├── ui/                ← Button, Input, Table, Dialog, Badge, etc.
│   │   ├── hooks/             ← useDebounce, usePagination, useMediaQuery
│   │   ├── lib/               ← axios instance, queryClient
│   │   └── utils/             ← formatDate, formatCurrency, cn()
│   ├── layouts/
│   │   ├── AppLayout.tsx      ← Sidebar + Header + Content shell
│   │   └── AuthLayout.tsx     ← Centered auth pages
│   └── pages/
│       ├── DashboardPage.tsx
│       ├── LoginPage.tsx
│       └── NotFoundPage.tsx
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Database Schema (Phase 1)

All tables share base fields: `id (UUID)`, `createdAt`, `updatedAt`, `deletedAt`, `createdBy`, `updatedBy`.

### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| phoneNumber | VARCHAR(20) | UNIQUE |
| passwordHash | TEXT | NOT NULL |
| firstName | VARCHAR(100) | NOT NULL |
| lastName | VARCHAR(100) | NOT NULL |
| avatarUrl | TEXT | |
| isActive | BOOLEAN | DEFAULT true |
| isEmailVerified | BOOLEAN | DEFAULT false |
| lastLoginAt | TIMESTAMP | |
| roleId | UUID | FK → roles.id |
| branchId | UUID | FK → branches.id (nullable for admin) |
| createdAt | TIMESTAMP | |
| updatedAt | TIMESTAMP | |
| deletedAt | TIMESTAMP | Soft delete |
| createdBy | UUID | FK → users.id |
| updatedBy | UUID | FK → users.id |

### `roles`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(100) | UNIQUE |
| slug | VARCHAR(100) | UNIQUE (e.g., `super-admin`) |
| description | TEXT | |
| isSystem | BOOLEAN | Built-in roles cannot be deleted |
| createdAt | TIMESTAMP | |
| updatedAt | TIMESTAMP | |
| deletedAt | TIMESTAMP | |

### `permissions`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(200) | UNIQUE (e.g., `users:read`) |
| module | VARCHAR(100) | e.g., `users`, `inventory` |
| action | VARCHAR(100) | e.g., `read`, `write`, `delete` |
| description | TEXT | |

### `role_permissions` (Join Table)
| Column | Type |
|---|---|
| roleId | UUID FK |
| permissionId | UUID FK |

### `refresh_tokens`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK → users.id |
| token | TEXT | Hashed |
| expiresAt | TIMESTAMP | |
| isRevoked | BOOLEAN | DEFAULT false |
| ipAddress | VARCHAR(50) | |
| userAgent | TEXT | |
| createdAt | TIMESTAMP | |

### `audit_logs`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID | Who performed action |
| action | VARCHAR(100) | e.g., `USER_CREATED` |
| entity | VARCHAR(100) | e.g., `User` |
| entityId | UUID | Affected record |
| oldValues | JSONB | Snapshot before |
| newValues | JSONB | Snapshot after |
| ipAddress | VARCHAR(50) | |
| userAgent | TEXT | |
| createdAt | TIMESTAMP | |

### `notifications`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID | Recipient |
| title | VARCHAR(255) | |
| message | TEXT | |
| type | ENUM | `info`, `success`, `warning`, `error` |
| isRead | BOOLEAN | DEFAULT false |
| readAt | TIMESTAMP | |
| entityType | VARCHAR(100) | Optional deep link context |
| entityId | UUID | Optional |
| createdAt | TIMESTAMP | |

### `password_reset_tokens`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK → users.id |
| token | TEXT | Hashed |
| expiresAt | TIMESTAMP | 15 minute TTL |
| usedAt | TIMESTAMP | |
| createdAt | TIMESTAMP | |

### `branches` (minimal for Phase 1)
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(200) | |
| code | VARCHAR(50) | |
| address | TEXT | |
| isActive | BOOLEAN | DEFAULT true |
| createdAt | TIMESTAMP | |
| updatedAt | TIMESTAMP | |
| deletedAt | TIMESTAMP | |

---

## API Endpoints (Phase 1)

### Auth Module — `/api/v1/auth`

| Method | Endpoint | Guard | Description |
|---|---|---|---|
| POST | `/login` | Public | Email + password login → JWT pair |
| POST | `/logout` | JWT | Revoke refresh token |
| POST | `/refresh` | RefreshJWT | Issue new access token |
| POST | `/forgot-password` | Public | Send reset email |
| POST | `/reset-password` | Public | Validate token + set new password |
| PATCH | `/change-password` | JWT | Change password (auth'd user) |
| GET | `/profile` | JWT | Get current user profile |
| PATCH | `/profile` | JWT | Update profile (name, avatar) |

### Users Module — `/api/v1/users`

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/` | `users:read` | List users (paginated, filtered) |
| GET | `/:id` | `users:read` | Get user by ID |
| POST | `/` | `users:write` | Create user |
| PATCH | `/:id` | `users:write` | Update user |
| PATCH | `/:id/deactivate` | `users:write` | Soft deactivate |
| PATCH | `/:id/activate` | `users:write` | Re-activate |
| DELETE | `/:id` | `users:delete` | Soft delete |
| PATCH | `/:id/role` | `users:manage-roles` | Assign role |
| GET | `/:id/audit-logs` | `users:read` | Audit history |

### Roles Module — `/api/v1/roles`

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/` | `roles:read` | List all roles |
| GET | `/:id` | `roles:read` | Get role + permissions |
| POST | `/` | `roles:write` | Create role |
| PATCH | `/:id` | `roles:write` | Update role |
| DELETE | `/:id` | `roles:delete` | Delete non-system role |
| PATCH | `/:id/permissions` | `roles:manage-permissions` | Assign permissions |

### Permissions Module — `/api/v1/permissions`

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/` | `permissions:read` | List all permissions (grouped) |

### Notifications Module — `/api/v1/notifications`

| Method | Endpoint | Guard | Description |
|---|---|---|---|
| GET | `/` | JWT | Get user notifications (paginated) |
| GET | `/unread-count` | JWT | Get unread count |
| PATCH | `/:id/read` | JWT | Mark single as read |
| PATCH | `/read-all` | JWT | Mark all as read |

### Audit Logs Module — `/api/v1/audit-logs`

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/` | `audit-logs:read` | Paginated audit logs with filters |

---

## State Management

### Redux Toolkit Slices

| Slice | State | Actions |
|---|---|---|
| `authSlice` | `user`, `accessToken`, `isAuthenticated`, `isLoading` | `setCredentials`, `clearCredentials`, `updateProfile` |
| `uiSlice` | `sidebarOpen`, `theme` (`light`/`dark`), `commandMenuOpen` | `toggleSidebar`, `setTheme`, `toggleCommandMenu` |
| `notificationSlice` | `unreadCount`, `notifications[]` | `setUnreadCount`, `markRead`, `addNotification` |

### RTK Query APIs

| API | Endpoints |
|---|---|
| `authApi` | `login`, `logout`, `refresh`, `getProfile`, `updateProfile`, `forgotPassword`, `resetPassword`, `changePassword` |
| `usersApi` | `getUsers`, `getUserById`, `createUser`, `updateUser`, `deactivateUser`, `deleteUser`, `assignRole` |
| `rolesApi` | `getRoles`, `getRoleById`, `createRole`, `updateRole`, `deleteRole`, `updateRolePermissions` |
| `permissionsApi` | `getPermissions` |
| `notificationsApi` | `getNotifications`, `getUnreadCount`, `markRead`, `markAllRead` |

### TanStack Query
Used for **non-auth data** that benefits from smart caching (e.g., dashboard stats, audit logs). RTK Query handles auth-sensitive, normalized API state.

---

## Component Hierarchy

```
<App>
  <Providers>               ← Redux, QueryClient, ThemeProvider, ToastProvider
    <Router>
      <AuthLayout>          ← For /login, /forgot-password, /reset-password
        <LoginPage>
          <LoginForm>
            <Input />, <Button />, <FormError />
      <AppLayout>           ← For all authenticated routes
        <Sidebar>
          <SidebarLogo />
          <SidebarNav>
            <NavSection />
              <NavItem />
          <SidebarFooter />
        <Header>
          <CommandMenu />   ← Global search (⌘K)
          <NotificationPanel>
            <NotificationItem />
          <ThemeToggle />
          <UserMenu>
            <Avatar />
        <ContentArea>
          <DashboardPage>
            <StatsGrid>
              <StatCard />
            <RecentActivityFeed>
              <ActivityItem />
          <UsersPage>
            <PageHeader>
              <Breadcrumbs />
              <Button />    ← Add User
            <DataTable>
              <TableFilters />
              <TablePagination />
            <UserDrawer>  ← Slide-over for Create/Edit
              <UserForm />
          <RolesPage>
            <RoleCard />
            <PermissionsMatrix />
```

---

## Design System (Shadcn/UI + Tailwind)

### Color Tokens

```css
/* Light */
--background: 0 0% 100%
--foreground: 240 10% 3.9%
--card: 0 0% 100%
--primary: 221 83% 53%     /* Brand blue */
--accent: 262 83% 58%      /* Purple accent */

/* Dark */
--background: 240 10% 3.9%
--foreground: 0 0% 98%
--card: 240 10% 6%
```

### Typography Scale
- Display: `text-4xl font-bold tracking-tight`
- Heading: `text-2xl font-semibold`
- Body: `text-sm font-normal leading-relaxed`
- Caption: `text-xs text-muted-foreground`

### Spacing Grid
- Base unit: **8px** (Tailwind `gap-2` = 8px)
- Card padding: `p-6` (24px)
- Section spacing: `space-y-6` or `gap-6`

---

## Security Architecture

| Concern | Implementation |
|---|---|
| Password Hashing | `argon2` (winner over bcrypt for security) |
| Access Token | JWT, 15-minute expiry, RS256 signed |
| Refresh Token | Rotating, 7-day expiry, stored hashed in DB |
| RBAC | `RolesGuard` + `PermissionsGuard` on every protected route |
| Rate Limiting | `@nestjs/throttler` — 100 req/min globally, 5 req/min on auth |
| CORS | Whitelist frontend origin |
| Helmet | Security headers |
| Input Validation | `class-validator` + `class-transformer` on all DTOs |
| SQL Injection | Prisma ORM (parameterized queries only) |
| XSS | Input sanitization + CSP headers |
| Audit Trail | Every mutation logged to `audit_logs` via interceptor |

---

## Proposed Changes (Phase 1 Execution)

### Infrastructure

#### [NEW] `docker-compose.yml` — Root level
#### [NEW] `README.md`

---

### Backend (`/server`)

#### [NEW] NestJS project scaffold
#### [NEW] `prisma/schema.prisma` — Full Phase 1 schema
#### [NEW] `prisma/seed.ts` — Default roles, permissions, super admin
#### [NEW] `src/modules/auth/` — Full auth module
#### [NEW] `src/modules/users/` — Full users module
#### [NEW] `src/modules/roles/` — Full roles module
#### [NEW] `src/modules/permissions/` — Permissions module
#### [NEW] `src/modules/notifications/` — Notifications module
#### [NEW] `src/common/` — Guards, interceptors, decorators, filters

---

### Frontend (`/client`)

#### [NEW] Vite + React 19 + TypeScript scaffold
#### [NEW] `tailwind.config.ts` — Full design token configuration
#### [NEW] `src/shared/ui/` — Complete design system (Button, Input, Table, Dialog, Badge, Avatar, Skeleton, etc.)
#### [NEW] `src/layouts/AppLayout.tsx` — Main shell with sidebar + header
#### [NEW] `src/layouts/AuthLayout.tsx` — Centered auth layout
#### [NEW] `src/features/auth/` — Login, Forgot Password, Reset Password, Change Password
#### [NEW] `src/features/users/` — User management with table, drawer, form
#### [NEW] `src/features/roles/` — Role & permission management
#### [NEW] `src/features/dashboard/` — Stats cards, activity feed
#### [NEW] `src/features/notifications/` — Notification panel + WebSocket integration
#### [NEW] `src/app/store.ts` — Redux store
#### [NEW] `src/app/router.tsx` — Protected + public routes

---

## Verification Plan

### Automated Tests
```bash
# Backend unit + integration tests
cd server && npm run test
cd server && npm run test:e2e

# Frontend type checking
cd client && npx tsc --noEmit

# Linting
cd server && npm run lint
cd client && npm run lint
```

### Manual Verification
- Login flow (valid/invalid credentials, token refresh)
- Forgot password + reset flow
- Dark/light mode toggle persists across sessions
- Sidebar responsive: collapses on mobile, opens on desktop
- User CRUD: create → list → edit → deactivate → audit log
- Role assignment and permission matrix
- Notification badge updates via WebSocket
- All pages render loading skeletons, empty states, and error states correctly

---

> [!IMPORTANT]
> **Phase 1 is the foundation.** All subsequent modules (Kitchen, Inventory, Delivery, Finance) will plug into this auth/RBAC shell. Investing in correctness here eliminates rework later.

> [!NOTE]
> **Seed data** will create: 1 Super Admin user, all 12 system roles, and the full permissions matrix (~80 permissions across all planned modules). This means Phase 2 onward can immediately test RBAC without setup.

> [!WARNING]
> The **refresh token rotation** strategy uses **families** to detect token reuse attacks. If a refresh token is used twice (replay attack), the entire family is revoked, logging out all sessions for that user.
