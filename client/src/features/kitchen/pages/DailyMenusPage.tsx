import React, { useState } from 'react';
import { Link } from 'react-router';
import {
  useGetDailyMenusQuery,
  useCreateDailyMenuMutation,
  useUpdateMenuStatusMutation,
} from '../api/kitchenApi';
import { Button } from '../../../shared/ui/button';

interface MenuItem {
  id: string;
  recipe: { id: string; name: string };
}

interface DailyMenu {
  id: string;
  date: string;
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED';
  items: MenuItem[];
  branch?: { id: string; name: string } | null;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-yellow-500/15 text-yellow-600 border border-yellow-500/30' },
  PUBLISHED: { label: 'Published', className: 'bg-green-500/15 text-green-600 border border-green-500/30' },
  COMPLETED: { label: 'Completed', className: 'bg-muted text-muted-foreground border border-border' },
};

interface PlanMenuFormData {
  date: string;
}

const today = () => new Date().toISOString().split('T')[0];

export const DailyMenusPage: React.FC = () => {
  const { data: menus, isLoading } = useGetDailyMenusQuery({});
  const [createDailyMenu, { isLoading: isCreating }] = useCreateDailyMenuMutation();
  const [updateMenuStatus] = useUpdateMenuStatusMutation();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<PlanMenuFormData>({ date: today() });
  const [error, setError] = useState<string | null>(null);

  const openModal = () => {
    setForm({ date: today() });
    setError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.date) {
      setError('Please select a date.');
      return;
    }
    try {
      await createDailyMenu({ date: form.date }).unwrap();
      closeModal();
    } catch {
      setError('Failed to create menu. Please try again.');
    }
  };

  const handleStatusCycle = async (menu: DailyMenu) => {
    const next: Record<string, string> = { DRAFT: 'PUBLISHED', PUBLISHED: 'COMPLETED' };
    const nextStatus = next[menu.status];
    if (!nextStatus) return;
    await updateMenuStatus({ id: menu.id, status: nextStatus });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Daily Menus</h1>
          <p className="text-sm text-muted-foreground mt-1">Plan and manage daily kitchen menus</p>
        </div>
        <Button onClick={openModal}>+ Plan Menu</Button>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="text-4xl mb-3">🗓️</div>
            Loading menus...
          </div>
        ) : !menus || (menus as DailyMenu[]).length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="text-5xl mb-3">📋</div>
            <p className="font-medium">No menus planned yet</p>
            <p className="text-sm mt-1">Create your first daily menu to get started</p>
            <Button className="mt-4" onClick={openModal}>Plan Menu</Button>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground border-b">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Branch</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Items</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(menus as DailyMenu[]).map((menu) => {
                const cfg = statusConfig[menu.status] ?? statusConfig.DRAFT;
                return (
                  <tr key={menu.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      {new Date(menu.date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {menu.branch?.name ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {menu.items?.length || 0} recipe{menu.items?.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {menu.status !== 'COMPLETED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusCycle(menu)}
                          title={menu.status === 'DRAFT' ? 'Publish menu' : 'Mark as completed'}
                        >
                          {menu.status === 'DRAFT' ? 'Publish' : 'Complete'}
                        </Button>
                      )}
                      <Link to={`/kitchen/menus/${menu.id}`}>
                        <Button variant="outline" size="sm">Manage</Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Plan Menu Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Plan a New Menu</h2>
              <button
                onClick={closeModal}
                className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md px-4 py-2">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium">Menu Date *</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  disabled={isCreating}
                  autoFocus
                />
              </div>

              <p className="text-xs text-muted-foreground">
                The menu will be created as a <strong>Draft</strong>. You can add recipes and publish it afterward.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeModal} disabled={isCreating}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Menu'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
