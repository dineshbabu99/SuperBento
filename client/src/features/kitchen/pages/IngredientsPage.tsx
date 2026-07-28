import React, { useState } from 'react';
import {
  useGetIngredientsQuery,
  useCreateIngredientMutation,
  useUpdateIngredientMutation,
  useDeleteIngredientMutation,
} from '../api/kitchenApi';
import { Button } from '../../../shared/ui/button';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  defaultCost?: number | null;
}

interface IngredientFormData {
  name: string;
  unit: string;
  defaultCost: string;
}

const emptyForm: IngredientFormData = { name: '', unit: '', defaultCost: '' };

export const IngredientsPage: React.FC = () => {
  const { data: ingredients, isLoading } = useGetIngredientsQuery({});
  const [createIngredient, { isLoading: isCreating }] = useCreateIngredientMutation();
  const [updateIngredient, { isLoading: isUpdating }] = useUpdateIngredientMutation();
  const [deleteIngredient] = useDeleteIngredientMutation();

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Ingredient | null>(null);
  const [form, setForm] = useState<IngredientFormData>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setError(null);
    setShowModal(true);
  };

  const openEdit = (ingredient: Ingredient) => {
    setEditTarget(ingredient);
    setForm({
      name: ingredient.name,
      unit: ingredient.unit,
      defaultCost: ingredient.defaultCost != null ? String(ingredient.defaultCost) : '',
    });
    setError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTarget(null);
    setForm(emptyForm);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.unit.trim()) {
      setError('Name and unit are required.');
      return;
    }
    const payload = {
      name: form.name.trim(),
      unit: form.unit.trim(),
      ...(form.defaultCost !== '' && { defaultCost: Number(form.defaultCost) }),
    };
    try {
      if (editTarget) {
        await updateIngredient({ id: editTarget.id, ...payload }).unwrap();
      } else {
        await createIngredient(payload).unwrap();
      }
      closeModal();
    } catch {
      setError('Failed to save ingredient. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this ingredient?')) return;
    await deleteIngredient(id);
  };

  const isBusy = isCreating || isUpdating;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ingredients</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your kitchen ingredient library</p>
        </div>
        <Button onClick={openAdd}>+ Add Ingredient</Button>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="text-4xl mb-3">🥕</div>
            Loading ingredients...
          </div>
        ) : !ingredients || (ingredients as Ingredient[]).length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="text-5xl mb-3">🥄</div>
            <p className="font-medium">No ingredients yet</p>
            <p className="text-sm mt-1">Add your first ingredient to get started</p>
            <Button className="mt-4" onClick={openAdd}>Add Ingredient</Button>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground border-b">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Unit</th>
                <th className="px-6 py-3 font-medium">Default Cost</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(ingredients as Ingredient[]).map((ingredient) => (
                <tr key={ingredient.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-6 py-4 font-medium">{ingredient.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{ingredient.unit}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {ingredient.defaultCost != null ? `₹${ingredient.defaultCost}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(ingredient)}>
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => handleDelete(ingredient.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editTarget ? 'Edit Ingredient' : 'Add New Ingredient'}
              </h2>
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
                <label className="text-sm font-medium">Name *</label>
                <input
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. Chicken Breast"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={isBusy}
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Unit *</label>
                <input
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. kg, g, L, pcs"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  disabled={isBusy}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Default Cost (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. 12.50"
                  value={form.defaultCost}
                  onChange={(e) => setForm({ ...form, defaultCost: e.target.value })}
                  disabled={isBusy}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeModal} disabled={isBusy}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isBusy}>
                  {isBusy ? 'Saving...' : editTarget ? 'Save Changes' : 'Add Ingredient'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
