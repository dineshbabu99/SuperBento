import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useGetMenuByIdQuery,
  useGetRecipesQuery,
  useAddMenuItemMutation,
  useRemoveMenuItemMutation,
  useUpdateMenuStatusMutation,
} from '../api/kitchenApi';
import { Button } from '../../../shared/ui/button';
import { PageLoader } from '../../../shared/ui/page-loader';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Recipe {
  id: string;
  name: string;
  category?: string | null;
  prepTimeMinutes?: number | null;
}

interface MenuItemRow {
  id: string;
  mealType: string;
  targetQuantity: number;
  recipe: { id: string; name: string; category?: string | null };
}

interface DailyMenu {
  id: string;
  date: string;
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED';
  items: MenuItemRow[];
  branch?: { id: string; name: string } | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const;

const mealTypeLabel: Record<string, string> = {
  BREAKFAST: '🌅 Breakfast',
  LUNCH: '☀️ Lunch',
  DINNER: '🌙 Dinner',
  SNACK: '🍎 Snack',
};

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-yellow-500/15 text-yellow-600 border border-yellow-500/30' },
  PUBLISHED: { label: 'Published', className: 'bg-green-500/15 text-green-600 border border-green-500/30' },
  COMPLETED: { label: 'Completed', className: 'bg-muted text-muted-foreground border border-border' },
};

// ─── Component ───────────────────────────────────────────────────────────────

export const MenuDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: menu, isLoading, error } = useGetMenuByIdQuery(id!);
  const { data: recipes } = useGetRecipesQuery({});
  const [addMenuItem, { isLoading: isAdding }] = useAddMenuItemMutation();
  const [removeMenuItem] = useRemoveMenuItemMutation();
  const [updateMenuStatus] = useUpdateMenuStatusMutation();

  // Add recipe form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<string>('LUNCH');
  const [targetQuantity, setTargetQuantity] = useState('1');
  const [addError, setAddError] = useState<string | null>(null);

  // Recipe search filter
  const [recipeSearch, setRecipeSearch] = useState('');

  if (isLoading) return <PageLoader />;

  if (error || !menu) {
    return (
      <div className="p-6 text-center text-muted-foreground space-y-4">
        <div className="text-5xl">😕</div>
        <p className="font-medium">Menu not found or an error occurred.</p>
        <Link to="/kitchen/menus">
          <Button variant="outline">Back to Menus</Button>
        </Link>
      </div>
    );
  }

  const typedMenu = menu as DailyMenu;
  const typedRecipes = (recipes as Recipe[] | undefined) ?? [];
  const cfg = statusConfig[typedMenu.status] ?? statusConfig.DRAFT;

  // Group items by meal type
  const grouped = MEAL_TYPES.reduce<Record<string, MenuItemRow[]>>((acc, mt) => {
    acc[mt] = typedMenu.items.filter((i) => i.mealType === mt);
    return acc;
  }, {} as Record<string, MenuItemRow[]>);

  // Recipes already in the menu (by id)
  const addedRecipeIds = new Set(typedMenu.items.map((i) => i.recipe.id));

  const filteredRecipes = typedRecipes.filter(
    (r) =>
      !addedRecipeIds.has(r.id) &&
      (recipeSearch === '' || r.name.toLowerCase().includes(recipeSearch.toLowerCase())),
  );

  const handleStatusCycle = () => {
    const next: Record<string, string> = { DRAFT: 'PUBLISHED', PUBLISHED: 'COMPLETED' };
    const nextStatus = next[typedMenu.status];
    if (!nextStatus) return;
    updateMenuStatus({ id: typedMenu.id, status: nextStatus });
  };

  const handleAddRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!selectedRecipeId) {
      setAddError('Please select a recipe.');
      return;
    }
    try {
      await addMenuItem({
        menuId: id!,
        recipeId: selectedRecipeId,
        mealType: selectedMealType,
        targetQuantity: Number(targetQuantity) || 1,
      }).unwrap();
      setSelectedRecipeId('');
      setTargetQuantity('1');
      setRecipeSearch('');
      setShowAddForm(false);
    } catch {
      setAddError('Failed to add recipe. Please try again.');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Remove this recipe from the menu?')) return;
    await removeMenuItem({ menuId: id!, itemId });
  };

  const canEdit = typedMenu.status !== 'COMPLETED';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/kitchen/menus" className="hover:text-foreground transition-colors">
              Daily Menus
            </Link>
            <span>/</span>
            <span>
              {new Date(typedMenu.date).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Menu for{' '}
            {new Date(typedMenu.date).toLocaleDateString('en-IN', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </h1>
          {typedMenu.branch && (
            <p className="text-sm text-muted-foreground">📍 {typedMenu.branch.name}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cfg.className}`}>
            {cfg.label}
          </span>
          {canEdit && (
            <Button variant="outline" onClick={handleStatusCycle}>
              {typedMenu.status === 'DRAFT' ? 'Publish Menu' : 'Mark Complete'}
            </Button>
          )}
          {canEdit && (
            <Button onClick={() => { setShowAddForm(true); setAddError(null); }}>
              + Add Recipe
            </Button>
          )}
        </div>
      </div>

      {/* ── Stats bar ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {MEAL_TYPES.map((mt) => (
          <div key={mt} className="bg-card border rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground">{mealTypeLabel[mt]}</p>
            <p className="text-2xl font-bold mt-1">{grouped[mt].length}</p>
            <p className="text-xs text-muted-foreground">
              {grouped[mt].length === 1 ? 'recipe' : 'recipes'}
            </p>
          </div>
        ))}
      </div>

      {/* ── Menu items by meal type ─────────────────────────── */}
      {typedMenu.items.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center text-muted-foreground space-y-3">
          <div className="text-5xl">🍽️</div>
          <p className="font-medium">No recipes added yet</p>
          <p className="text-sm">Add recipes to plan this day's menu</p>
          {canEdit && (
            <Button className="mt-2" onClick={() => setShowAddForm(true)}>
              + Add Recipe
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {MEAL_TYPES.filter((mt) => grouped[mt].length > 0).map((mt) => (
            <div key={mt} className="bg-card border rounded-xl overflow-hidden">
              <div className="px-5 py-3 bg-muted/50 border-b flex items-center gap-2">
                <span className="font-semibold text-sm">{mealTypeLabel[mt]}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {grouped[mt].length} {grouped[mt].length === 1 ? 'recipe' : 'recipes'}
                </span>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="text-muted-foreground border-b">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Recipe</th>
                    <th className="px-5 py-2.5 font-medium">Category</th>
                    <th className="px-5 py-2.5 font-medium text-center">Qty</th>
                    {canEdit && <th className="px-5 py-2.5 font-medium text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {grouped[mt].map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-medium">{item.recipe.name}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {item.recipe.category ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-center">{item.targetQuantity}</td>
                      {canEdit && (
                        <td className="px-5 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            Remove
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* ── Add Recipe Modal ────────────────────────────────── */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Recipe to Menu</h2>
              <button
                onClick={() => { setShowAddForm(false); setAddError(null); setRecipeSearch(''); }}
                className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRecipe} className="space-y-4">
              {addError && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md px-4 py-2">
                  {addError}
                </div>
              )}

              {/* Recipe search + select */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipe *</label>
                <input
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Search recipes..."
                  value={recipeSearch}
                  onChange={(e) => {
                    setRecipeSearch(e.target.value);
                    setSelectedRecipeId('');
                  }}
                  autoFocus
                />
                {(recipeSearch || filteredRecipes.length > 0) && (
                  <div className="border rounded-md max-h-48 overflow-y-auto bg-background shadow-sm">
                    {filteredRecipes.length === 0 ? (
                      <p className="px-3 py-3 text-sm text-muted-foreground">
                        {recipeSearch ? 'No matching recipes' : 'All recipes already added'}
                      </p>
                    ) : (
                      filteredRecipes.map((r) => (
                        <button
                          type="button"
                          key={r.id}
                          className={`w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors flex items-center justify-between ${
                            selectedRecipeId === r.id ? 'bg-primary/10 font-medium' : ''
                          }`}
                          onClick={() => {
                            setSelectedRecipeId(r.id);
                            setRecipeSearch(r.name);
                          }}
                        >
                          <span>{r.name}</span>
                          {r.category && (
                            <span className="text-xs text-muted-foreground">{r.category}</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Meal Type */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Meal Type *</label>
                <div className="grid grid-cols-4 gap-2">
                  {MEAL_TYPES.map((mt) => (
                    <button
                      type="button"
                      key={mt}
                      className={`py-2 px-2 rounded-md border text-xs font-medium transition-colors ${
                        selectedMealType === mt
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      }`}
                      onClick={() => setSelectedMealType(mt)}
                    >
                      {mealTypeLabel[mt]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Quantity */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Target Quantity (servings)</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={targetQuantity}
                  onChange={(e) => setTargetQuantity(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowAddForm(false); setAddError(null); setRecipeSearch(''); }}
                  disabled={isAdding}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isAdding || !selectedRecipeId}>
                  {isAdding ? 'Adding...' : 'Add to Menu'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
