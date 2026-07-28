import { RootState } from './store';

export const selectTheme = (state: RootState) => state.ui.theme;
export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpen;
export const selectSidebarCollapsed = (state: RootState) => state.ui.sidebarCollapsed;
export const selectCommandMenuOpen = (state: RootState) => state.ui.commandMenuOpen;
