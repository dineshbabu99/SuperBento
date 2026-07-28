import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@shared/lib/rtkBaseQuery';
import { setCredentials, clearCredentials } from '../store/authSlice';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    phoneNumber: string | null;
    avatarUrl: string | null;
    status: string;
    isEmailVerified: boolean;
    lastLoginAt: string | null;
    roleId: string | null;
    role: { id: string; name: string; slug: string } | null;
    branch: { id: string; name: string; code: string } | null;
  };
  permissions: string[];
  accessToken: string;
  refreshToken: string;
}

interface ProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  status: string;
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  roleId: string | null;
  role: { id: string; name: string; slug: string } | null;
  branch: { id: string; name: string; code: string } | null;
  permissions: string[];
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: axiosBaseQuery({ baseUrl: '' }),
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        data: credentials,
      }),
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              user: { ...data.user, permissions: data.permissions },
            }),
          );
        } catch {
          // Error handled by the component
        }
      },
    }),

    logout: builder.mutation<{ message: string }, { refreshToken?: string }>({
      query: (body) => ({
        url: '/auth/logout',
        method: 'POST',
        data: body,
      }),
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
        } finally {
          dispatch(clearCredentials());
        }
      },
    }),

    forgotPassword: builder.mutation<{ message: string }, { email: string }>({
      query: (body) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        data: body,
      }),
    }),

    resetPassword: builder.mutation<{ message: string }, { token: string; password: string }>({
      query: (body) => ({
        url: '/auth/reset-password',
        method: 'POST',
        data: body,
      }),
    }),

    changePassword: builder.mutation<
      { message: string },
      { currentPassword: string; newPassword: string }
    >({
      query: (body) => ({
        url: '/auth/change-password',
        method: 'PATCH',
        data: body,
      }),
    }),

    getProfile: builder.query<ProfileResponse, void>({
      query: () => ({ url: '/auth/profile', method: 'GET' }),
    }),

    updateProfile: builder.mutation<
      ProfileResponse,
      { firstName?: string; lastName?: string; phoneNumber?: string; avatarUrl?: string }
    >({
      query: (body) => ({
        url: '/auth/profile',
        method: 'PATCH',
        data: body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
} = authApi;
