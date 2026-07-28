import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Theme = 'light' | 'dark' | 'system';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: Theme;
  commandMenuOpen: boolean;
}

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem('superbento-theme') as Theme | null;
  return stored || 'dark';
};

const initialState: UIState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  theme: getInitialTheme(),
  commandMenuOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
      localStorage.setItem('superbento-theme', action.payload);
    },
    toggleCommandMenu: (state) => {
      state.commandMenuOpen = !state.commandMenuOpen;
    },
    setCommandMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.commandMenuOpen = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleSidebarCollapsed,
  setTheme,
  toggleCommandMenu,
  setCommandMenuOpen,
} = uiSlice.actions;

export default uiSlice.reducer;
