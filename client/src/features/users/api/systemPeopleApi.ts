import { apiSlice } from '../../../app/api/apiSlice';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  roleId: string;
  branchId?: string | null;
  role?: { id: string; name: string; slug: string } | null;
  branch?: { id: string; name: string } | null;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isSystem: boolean;
  permissions: Array<{ permissionId: string; permission: { id: string; name: string; module: string; description?: string | null } }>;
}

export interface Permission {
  id: string;
  name: string;
  module: string;
  description?: string | null;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
}

// ─── API Slice ──────────────────────────────────────────────────────────────

export const systemPeopleApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Users ─────────────────────────────────────────────
    getUsers: builder.query<{ data: User[]; total: number; page: number }, { search?: string; roleId?: string; status?: string; page?: number }>({
      query: (params) => ({ url: '/users', params }),
      providesTags: ['User'],
    }),
    createUser: builder.mutation<User, Partial<User> & { password?: string }>({
      query: (body) => ({ url: '/users', method: 'POST', data: body }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation<User, { id: string } & Partial<User>>({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PATCH', data: body }),
      invalidatesTags: ['User'],
    }),
    activateUser: builder.mutation<void, string>({
      query: (id) => ({ url: `/users/${id}/activate`, method: 'PATCH' }),
      invalidatesTags: ['User'],
    }),
    deactivateUser: builder.mutation<void, string>({
      query: (id) => ({ url: `/users/${id}/deactivate`, method: 'PATCH' }),
      invalidatesTags: ['User'],
    }),
    assignUserRole: builder.mutation<void, { id: string; roleId: string }>({
      query: ({ id, roleId }) => ({ url: `/users/${id}/role`, method: 'PATCH', data: { roleId } }),
      invalidatesTags: ['User'],
    }),

    // ── Roles & Permissions ───────────────────────────────
    getRoles: builder.query<Role[], void>({
      query: () => ({ url: '/roles' }),
      providesTags: ['Role'],
    }),
    getRoleById: builder.query<Role, string>({
      query: (id) => ({ url: `/roles/${id}` }),
      providesTags: (result, error, id) => [{ type: 'Role', id }],
    }),
    createRole: builder.mutation<Role, Partial<Role>>({
      query: (body) => ({ url: '/roles', method: 'POST', data: body }),
      invalidatesTags: ['Role'],
    }),
    updateRole: builder.mutation<Role, { id: string } & Partial<Role>>({
      query: ({ id, ...body }) => ({ url: `/roles/${id}`, method: 'PATCH', data: body }),
      invalidatesTags: ['Role'],
    }),
    deleteRole: builder.mutation<void, string>({
      query: (id) => ({ url: `/roles/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Role'],
    }),
    updateRolePermissions: builder.mutation<void, { id: string; permissionIds: string[] }>({
      query: ({ id, permissionIds }) => ({ url: `/roles/${id}/permissions`, method: 'PATCH', data: { permissionIds } }),
      invalidatesTags: ['Role'],
    }),
    getPermissions: builder.query<Array<{ module: string; permissions: Permission[] }>, void>({
      query: () => ({ url: '/permissions' }),
    }),

    // ── Notifications ─────────────────────────────────────
    getNotifications: builder.query<{ data: Notification[]; total: number; page: number }, { page?: number; limit?: number }>({
      query: (params) => ({ url: '/notifications', params }),
      providesTags: ['Notification'],
    }),
    getUnreadNotificationsCount: builder.query<{ count: number }, void>({
      query: () => ({ url: '/notifications/unread-count' }),
      providesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation<void, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsRead: builder.mutation<void, void>({
      query: () => ({ url: '/notifications/read-all', method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),

    // ── Settings & Branches ───────────────────────────────
    getSystemSettings: builder.query<Record<string, string>, void>({
      query: () => ({ url: '/settings' }),
      providesTags: ['Setting' as any],
    }),
    updateSystemSettings: builder.mutation<Record<string, string>, Record<string, string>>({
      query: (settings) => ({ url: '/settings', method: 'POST', data: { settings } }),
      invalidatesTags: ['Setting' as any],
    }),
    getBranches: builder.query<Branch[], void>({
      query: () => ({ url: '/branches' }),
      providesTags: ['Branch' as any],
    }),
    createBranch: builder.mutation<Branch, Partial<Branch>>({
      query: (body) => ({ url: '/branches', method: 'POST', data: body }),
      invalidatesTags: ['Branch' as any],
    }),
    updateBranch: builder.mutation<Branch, { id: string } & Partial<Branch>>({
      query: ({ id, ...body }) => ({ url: `/branches/${id}`, method: 'PATCH', data: body }),
      invalidatesTags: ['Branch' as any],
    }),
    deleteBranch: builder.mutation<void, string>({
      query: (id) => ({ url: `/branches/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Branch' as any],
    }),
  }),
});

export const {
  // Users
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useActivateUserMutation,
  useDeactivateUserMutation,
  useAssignUserRoleMutation,
  // Roles
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useUpdateRolePermissionsMutation,
  useGetPermissionsQuery,
  // Notifications
  useGetNotificationsQuery,
  useGetUnreadNotificationsCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  // Settings & Branches
  useGetSystemSettingsQuery,
  useUpdateSystemSettingsMutation,
  useGetBranchesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
} = systemPeopleApi;
