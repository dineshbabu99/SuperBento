import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute } from '@/shared/ui/protected-route';
import { PageLoader } from '@/shared/ui/page-loader';

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'));
const RolesPage = lazy(() => import('@/features/roles/pages/RolesPage'));
const ProfilePage = lazy(() => import('@/features/auth/pages/ProfilePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const IngredientsPage = lazy(() => import('@/features/kitchen/pages/IngredientsPage').then(m => ({ default: m.IngredientsPage })));
const RecipesPage = lazy(() => import('@/features/kitchen/pages/RecipesPage').then(m => ({ default: m.RecipesPage })));
const RecipeFormPage = lazy(() => import('@/features/kitchen/pages/RecipeFormPage').then(m => ({ default: m.RecipeFormPage })));
const RecipeDetailPage = lazy(() => import('@/features/kitchen/pages/RecipeDetailPage').then(m => ({ default: m.RecipeDetailPage })));
const DailyMenusPage = lazy(() => import('@/features/kitchen/pages/DailyMenusPage').then(m => ({ default: m.DailyMenusPage })));
const MenuDetailPage = lazy(() => import('@/features/kitchen/pages/MenuDetailPage').then(m => ({ default: m.MenuDetailPage })));
const PrepBoardPage = lazy(() => import('@/features/kitchen/pages/PrepBoardPage').then(m => ({ default: m.PrepBoardPage })));

// Operations Pages
const SuppliersPage = lazy(() => import('@/features/operations/pages/SuppliersPage').then(m => ({ default: m.SuppliersPage })));
const InventoryPage = lazy(() => import('@/features/operations/pages/InventoryPage').then(m => ({ default: m.InventoryPage })));
const LowStockAlertsPage = lazy(() => import('@/features/operations/pages/LowStockAlertsPage').then(m => ({ default: m.LowStockAlertsPage })));
const PurchasesPage = lazy(() => import('@/features/operations/pages/PurchasesPage').then(m => ({ default: m.PurchasesPage })));
const PurchaseFormPage = lazy(() => import('@/features/operations/pages/PurchaseFormPage').then(m => ({ default: m.PurchaseFormPage })));
const PurchaseDetailPage = lazy(() => import('@/features/operations/pages/PurchaseDetailPage').then(m => ({ default: m.PurchaseDetailPage })));
const DeliveryPage = lazy(() => import('@/features/operations/pages/DeliveryPage').then(m => ({ default: m.DeliveryPage })));
const DeliveryDetailPage = lazy(() => import('@/features/operations/pages/DeliveryDetailPage').then(m => ({ default: m.DeliveryDetailPage })));

// Business Pages
const FinancePage = lazy(() => import('@/features/business/pages/FinancePage').then(m => ({ default: m.FinancePage })));
const HRPage = lazy(() => import('@/features/business/pages/HRPage').then(m => ({ default: m.HRPage })));
const ReportsPage = lazy(() => import('@/features/business/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));

// System Pages
const NotificationsPage = lazy(() => import('@/features/notifications/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

export const router = createBrowserRouter([
  // ─── Auth Routes (public) ──────────────────────────────
  {
    element: (
      <AuthLayout>
        <SuspenseWrapper>
          <Outlet />
        </SuspenseWrapper>
      </AuthLayout>
    ),
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },

  // ─── Protected App Routes ─────────────────────────────
  {
    element: (
      <ProtectedRoute>
        <AppLayout>
          <SuspenseWrapper>
            <Outlet />
          </SuspenseWrapper>
        </AppLayout>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <DashboardPage /> },
      {
        path: '/users',
        element: (
          <ProtectedRoute permission="users:read">
            <UsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/roles',
        element: (
          <ProtectedRoute permission="roles:read">
            <RolesPage />
          </ProtectedRoute>
        ),
      },
      { path: '/profile', element: <ProfilePage /> },
      // Kitchen Routes
      { path: '/kitchen', element: <Navigate to="/kitchen/menus" replace /> },
      { path: '/kitchen/ingredients', element: <IngredientsPage /> },
      { path: '/kitchen/recipes', element: <RecipesPage /> },
      { path: '/kitchen/recipes/new', element: <RecipeFormPage /> },
      { path: '/kitchen/recipes/:id', element: <RecipeDetailPage /> },
      { path: '/kitchen/menus', element: <DailyMenusPage /> },
      { path: '/kitchen/menus/:id', element: <MenuDetailPage /> },
      { path: '/kitchen/tasks', element: <PrepBoardPage /> },

      // Operations Routes
      {
        path: '/suppliers',
        element: (
          <ProtectedRoute permission="suppliers:read">
            <SuppliersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/inventory',
        element: (
          <ProtectedRoute permission="inventory:read">
            <InventoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/inventory/alerts',
        element: (
          <ProtectedRoute permission="inventory:read">
            <LowStockAlertsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/purchases',
        element: (
          <ProtectedRoute permission="purchases:read">
            <PurchasesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/purchases/new',
        element: (
          <ProtectedRoute permission="purchases:write">
            <PurchaseFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/purchases/:id',
        element: (
          <ProtectedRoute permission="purchases:read">
            <PurchaseDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/delivery',
        element: (
          <ProtectedRoute permission="delivery:read">
            <DeliveryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/delivery/:id',
        element: (
          <ProtectedRoute permission="delivery:read">
            <DeliveryDetailPage />
          </ProtectedRoute>
        ),
      },
      // Business Routes
      {
        path: '/finance',
        element: (
          <ProtectedRoute permission="finance:read">
            <FinancePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/hr',
        element: (
          <ProtectedRoute permission="hr:read">
            <HRPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/reports',
        element: (
          <ProtectedRoute permission="reports:read">
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      // System Routes
      {
        path: '/notifications',
        element: <NotificationsPage />,
      },
      {
        path: '/settings',
        element: (
          <ProtectedRoute permission="settings:read">
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // ─── Catch-all ────────────────────────────────────────
  {
    path: '*',
    element: (
      <SuspenseWrapper>
        <NotFoundPage />
      </SuspenseWrapper>
    ),
  },
]);
