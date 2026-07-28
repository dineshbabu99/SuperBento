import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { safeJsonParse } from '@shared/utils';

interface AuthUser {
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

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Persist tokens in localStorage (in production, use secure httpOnly cookies)
const getStoredAuth = () => {
  const token = localStorage.getItem('sb_access_token');
  const refresh = localStorage.getItem('sb_refresh_token');
  const user = localStorage.getItem('sb_user');
  return {
    accessToken: token,
    refreshToken: refresh,
    user: user ? safeJsonParse<AuthUser>(user, null as unknown as AuthUser) : null,
    isAuthenticated: !!token,
  };
};

const stored = getStoredAuth();

const initialState: AuthState = {
  user: stored.user,
  accessToken: stored.accessToken,
  refreshToken: stored.refreshToken,
  isAuthenticated: stored.isAuthenticated,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken?: string; user?: AuthUser }>,
    ) => {
      const { accessToken, refreshToken, user } = action.payload;
      state.accessToken = accessToken;
      state.isAuthenticated = true;
      state.isLoading = false;

      if (refreshToken) {
        state.refreshToken = refreshToken;
        localStorage.setItem('sb_refresh_token', refreshToken);
      }
      if (user) {
        state.user = user;
        localStorage.setItem('sb_user', JSON.stringify(user));
      }
      localStorage.setItem('sb_access_token', accessToken);
    },

    updateProfile: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('sb_user', JSON.stringify(state.user));
      }
    },

    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      localStorage.removeItem('sb_access_token');
      localStorage.removeItem('sb_refresh_token');
      localStorage.removeItem('sb_user');
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, clearCredentials, updateProfile, setLoading } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAccessToken = (state: { auth: AuthState }) => state.auth.accessToken;
export const selectUserPermissions = (state: { auth: AuthState }) => state.auth.user?.permissions ?? [];
export const selectUserRole = (state: { auth: AuthState }) => state.auth.user?.role?.slug;
