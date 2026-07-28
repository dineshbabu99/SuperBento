import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Moon, Sun, Monitor, Bell, ChevronDown, Settings, LogOut, User } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { toggleSidebar } from '@/app/uiSlice';
import { setTheme } from '@/app/uiSlice';
import { selectCurrentUser } from '@/features/auth/store/authSlice';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { useLogoutMutation } from '@/features/auth/api/authApi';
import { cn } from '@/shared/utils';
import { RootState } from '@/app/store';

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

export function AppHeader() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectCurrentUser);
  const theme = useAppSelector((state: RootState) => state.ui.theme);
  const unreadCount = useAppSelector((state: RootState) => state.notifications.unreadCount);
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout({}).unwrap();
    } catch { /* ignore */ }
    navigate('/login');
  };

  const ThemeIcon = themeOptions.find((t) => t.value === theme)?.icon ?? Moon;

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur-sm px-4 lg:px-6 shrink-0">
      {/* Sidebar toggle */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => dispatch(toggleSidebar())}
        aria-label="Toggle sidebar"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Search trigger */}
      <button
        className="flex flex-1 max-w-md items-center gap-2 rounded-lg border border-input bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
        onClick={() => {/* TODO: open command menu */}}
        aria-label="Search"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search anything...</span>
        <kbd className="ml-auto text-[10px] border border-border rounded px-1.5 py-0.5 bg-background font-mono hidden sm:block">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        {/* Theme toggle */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Toggle theme">
              <ThemeIcon className="h-4 w-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[140px] overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-xl animate-in fade-in-0 zoom-in-95"
              align="end"
            >
              {themeOptions.map((opt) => (
                <DropdownMenu.Item
                  key={opt.value}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors',
                    'hover:bg-accent/10 hover:text-accent-foreground focus:bg-accent/10 focus:text-accent-foreground outline-none',
                    theme === opt.value && 'bg-primary/10 text-primary font-medium',
                  )}
                  onSelect={() => dispatch(setTheme(opt.value))}
                >
                  <opt.icon className="h-3.5 w-3.5" />
                  {opt.label}
                  {theme === opt.value && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label="Notifications"
          onClick={() => navigate('/notifications')}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {/* User menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors -mr-1 focus:outline-none focus:ring-2 focus:ring-ring">
              <Avatar
                src={currentUser?.avatarUrl}
                firstName={currentUser?.firstName}
                lastName={currentUser?.lastName}
                size="sm"
              />
              <div className="hidden sm:block text-left min-w-0">
                <p className="text-xs font-medium text-foreground truncate max-w-[120px]">
                  {currentUser?.firstName} {currentUser?.lastName}
                </p>
                <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                  {currentUser?.role?.name ?? '—'}
                </p>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block shrink-0" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[200px] overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-xl animate-in fade-in-0 zoom-in-95"
              align="end"
              sideOffset={8}
            >
              {/* User info header */}
              <div className="px-3 py-2 border-b border-border mb-1">
                <p className="text-xs font-semibold text-foreground">
                  {currentUser?.firstName} {currentUser?.lastName}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{currentUser?.email}</p>
              </div>

              {[
                { label: 'My Profile', icon: User, to: '/profile' },
                { label: 'Settings', icon: Settings, to: '/settings' },
              ].map((item) => (
                <DropdownMenu.Item
                  key={item.to}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-accent/10 hover:text-accent-foreground focus:bg-accent/10 focus:text-accent-foreground outline-none transition-colors"
                  onSelect={() => navigate(item.to)}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </DropdownMenu.Item>
              ))}

              <DropdownMenu.Separator className="my-1 h-px bg-border" />

              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive outline-none transition-colors"
                onSelect={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="h-3.5 w-3.5" />
                {isLoggingOut ? 'Logging out...' : 'Log out'}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
