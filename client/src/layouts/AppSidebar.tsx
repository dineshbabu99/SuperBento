import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/shared/ui/logo';
import {
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  LogOut,
  ChevronLeft,
  UtensilsCrossed,
  PackageOpen,
  ShoppingCart,
  Truck,
  DollarSign,
  Users2,
  BarChart3,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { selectSidebarOpen } from '@/app/selectors';
import { toggleSidebar, setSidebarOpen } from '@/app/uiSlice';
import { selectCurrentUser, selectUserPermissions } from '@/features/auth/store/authSlice';
import { useLogoutMutation } from '@/features/auth/api/authApi';
import { Avatar } from '@/shared/ui/avatar';
import { cn } from '@/shared/utils';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  permission?: string;
  badge?: string | number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, permission: 'dashboard:read' },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'Users', to: '/users', icon: Users, permission: 'users:read' },
      { label: 'Roles & Permissions', to: '/roles', icon: Shield, permission: 'roles:read' },
    ],
  },
  {
    title: 'Kitchen',
    items: [
      { label: 'Daily Menus', to: '/kitchen/menus', icon: LayoutDashboard, permission: 'kitchen:read' },
      { label: 'Prep Board', to: '/kitchen/tasks', icon: UtensilsCrossed, permission: 'kitchen:read' },
      { label: 'Recipes', to: '/kitchen/recipes', icon: ShoppingCart, permission: 'kitchen:read' },
      { label: 'Ingredients', to: '/kitchen/ingredients', icon: PackageOpen, permission: 'kitchen:read' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Inventory', to: '/inventory', icon: PackageOpen, permission: 'inventory:read' },
      { label: 'Purchases', to: '/purchases', icon: ShoppingCart, permission: 'purchases:read' },
      { label: 'Suppliers', to: '/suppliers', icon: Users2, permission: 'suppliers:read' },
      { label: 'Delivery', to: '/delivery', icon: Truck, permission: 'delivery:read' },
    ],
  },
  {
    title: 'Business',
    items: [
      { label: 'Finance', to: '/finance', icon: DollarSign, permission: 'finance:read' },
      { label: 'HR', to: '/hr', icon: Users2, permission: 'hr:read' },
      { label: 'Reports', to: '/reports', icon: BarChart3, permission: 'reports:read' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Notifications', to: '/notifications', icon: Bell },
      { label: 'Settings', to: '/settings', icon: Settings, permission: 'settings:read' },
    ],
  },
];

interface AppSidebarProps {
  isMobile: boolean;
}

export function AppSidebar({ isMobile }: AppSidebarProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const sidebarOpen = useAppSelector(selectSidebarOpen);
  const currentUser = useAppSelector(selectCurrentUser);
  const permissions = useAppSelector(selectUserPermissions);
  const isSuperAdmin = currentUser?.role?.slug === 'super-admin';
  const [logout] = useLogoutMutation();

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    if (isSuperAdmin) return true;
    return permissions.includes(permission);
  };

  const handleLogout = async () => {
    try {
      await logout({}).unwrap();
    } catch {
      // Force logout anyway
    }
    navigate('/login');
  };

  const sidebarVariants = {
    open: { x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
    closed: { x: '-100%', transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
  };

  return (
    <AnimatePresence mode="wait">
      {(sidebarOpen || !isMobile) && (
        <motion.aside
          key="sidebar"
          initial={isMobile ? 'closed' : 'open'}
          animate="open"
          exit={isMobile ? 'closed' : 'open'}
          variants={isMobile ? sidebarVariants : {}}
          className={cn(
            'fixed left-0 top-0 z-30 h-full w-64 flex flex-col',
            'bg-sidebar border-r border-sidebar-border',
          )}
        >
          {/* Logo */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border shrink-0">
            <Logo size={40} />
            <button
              onClick={() => {
                if (isMobile) {
                  dispatch(setSidebarOpen(false));
                } else {
                  dispatch(toggleSidebar());
                }
              }}
              className="h-7 w-7 rounded-md flex items-center justify-center text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors shrink-0"
              aria-label="Toggle sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-hide">
            {navSections.map((section) => {
              const visibleItems = section.items.filter((item) => hasPermission(item.permission));
              if (visibleItems.length === 0) return null;

              return (
                <div key={section.title}>
                  <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                    {section.title}
                  </p>
                  <ul className="space-y-0.5">
                    {visibleItems.map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          onClick={() => isMobile && dispatch(setSidebarOpen(false))}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group',
                              isActive
                                ? 'bg-sidebar-primary/20 text-sidebar-primary font-medium'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <item.icon
                                className={cn(
                                  'h-4 w-4 shrink-0 transition-colors',
                                  isActive
                                    ? 'text-sidebar-primary'
                                    : 'text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground',
                                )}
                              />
                              <span className="truncate">{item.label}</span>
                              {item.badge && (
                                <span className="ml-auto shrink-0 rounded-full bg-primary/20 text-primary text-[10px] font-medium px-1.5 py-0.5">
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>

          {/* User footer */}
          <div className="shrink-0 border-t border-sidebar-border p-3">
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer group"
              onClick={() => navigate('/profile')}
            >
              <Avatar
                src={currentUser?.avatarUrl}
                firstName={currentUser?.firstName}
                lastName={currentUser?.lastName}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-accent-foreground truncate">
                  {currentUser?.firstName} {currentUser?.lastName}
                </p>
                <p className="text-[10px] text-sidebar-foreground/50 truncate">
                  {currentUser?.role?.name ?? 'No role'}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                className="shrink-0 p-1.5 rounded-md text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                title="Logout"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
