import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetInventoryItemsQuery,
  useCreateInventoryItemMutation,
  useAdjustStockMutation,
  type InventoryItem,
  type StockMovementType,
} from '../api/operationsApi';
import { useGetIngredientsQuery } from '../../kitchen/api/kitchenApi';
import { Button } from '../../../shared/ui/button';

interface AdjustFormData {
  type: StockMovementType;
  quantity: string;
  note: string;
}

interface NewItemFormData {
  ingredientId: string;
  minStockLevel: string;
  currentStock: string;
}

const emptyAdjustForm: AdjustFormData = {
  type: 'ADJUSTMENT',
  quantity: '',
  note: '',
};

const emptyNewItemForm: NewItemFormData = {
  ingredientId: '',
  minStockLevel: '0',
  currentStock: '0',
};

const statusConfig: Record<string, { label: string; className: string }> = {
  OK: { label: 'In Stock', className: 'bg-green-500/15 text-green-600 border-green-500/30' },
  LOW: { label: 'Low Stock', className: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30' },
  CRITICAL: { label: 'Out of Stock', className: 'bg-red-500/15 text-red-600 border-red-500/30' },
};

export const InventoryPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const { data: inventory, isLoading } = useGetInventoryItemsQuery({ search: search || undefined });
  const { data: ingredients } = useGetIngredientsQuery({});
  
  const [createInventoryItem, { isLoading: isCreating }] = useCreateInventoryItemMutation();
  const [adjustStock, { isLoading: isAdjusting }] = useAdjustStockMutation();

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<InventoryItem | null>(null);
  const [adjustForm, setAdjustForm] = useState<AdjustFormData>(emptyAdjustForm);

  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [newForm, setNewForm] = useState<NewItemFormData>(emptyNewItemForm);

  const [error, setError] = useState<string | null>(null);

  const openAdjust = (item: InventoryItem) => {
    setAdjustTarget(item);
    setAdjustForm(emptyAdjustForm);
    setError(null);
    setShowAdjustModal(true);
  };

  const closeAdjustModal = () => {
    setShowAdjustModal(false);
    setAdjustTarget(null);
    setAdjustForm(emptyAdjustForm);
    setError(null);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!adjustTarget) return;

    const qty = parseFloat(adjustForm.quantity);
    if (isNaN(qty) || qty === 0) {
      setError('Please enter a valid non-zero quantity.');
      return;
    }

    try {
      await adjustStock({
        id: adjustTarget.id,
        type: adjustForm.type,
        quantity: qty,
        note: adjustForm.note.trim() || undefined,
      }).unwrap();
      closeAdjustModal();
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to adjust stock. Please try again.');
    }
  };

  const openNewItem = () => {
    setNewForm(emptyNewItemForm);
    setError(null);
    setShowNewItemModal(true);
  };

  const closeNewItemModal = () => {
    setShowNewItemModal(false);
    setNewForm(emptyNewItemForm);
    setError(null);
  };

  const handleNewItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!newForm.ingredientId) {
      setError('Please select an ingredient.');
      return;
    }

    const minStock = parseFloat(newForm.minStockLevel);
    const currStock = parseFloat(newForm.currentStock);

    if (isNaN(minStock) || minStock < 0 || isNaN(currStock) || currStock < 0) {
      setError('Quantities must be positive numbers.');
      return;
    }

    const selectedIng = ingredients?.find((i: any) => i.id === newForm.ingredientId);
    if (!selectedIng) return;

    try {
      await createInventoryItem({
        ingredientId: newForm.ingredientId,
        unit: selectedIng.unit,
        minStockLevel: minStock,
        currentStock: currStock,
      }).unwrap();
      closeNewItemModal();
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to create inventory item. It might already exist.');
    }
  };

  const isBusy = isCreating || isAdjusting;
  const list = inventory ?? [];

  // Filter out ingredients that already exist in the inventory list to prevent duplication
  const availableIngredients = ingredients?.filter(
    (ing: any) => !list.some((item) => item.ingredientId === ing.id)
  ) ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage ingredient stock levels</p>
        </div>
        <div className="flex gap-2">
          <Link to="/inventory/alerts">
            <Button variant="outline" className="border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10">
              ⚠️ View Alerts
            </Button>
          </Link>
          <Button onClick={openNewItem}>+ Track Ingredient</Button>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-3">
        <input
          className="w-full max-w-sm px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Search by ingredient name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <Button variant="outline" size="sm" onClick={() => setSearch('')}>Clear</Button>
        )}
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="text-4xl mb-3">📦</div>Loading inventory...
          </div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="text-5xl mb-3">🍏</div>
            <p className="font-medium">{search ? 'No inventory items match your search' : 'No tracked inventory yet'}</p>
            {!search && <Button className="mt-4" onClick={openNewItem}>Track your first ingredient</Button>}
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground border-b">
              <tr>
                <th className="px-6 py-3 font-medium">Ingredient</th>
                <th className="px-6 py-3 font-medium">Branch</th>
                <th className="px-6 py-3 font-medium">Current Stock</th>
                <th className="px-6 py-3 font-medium">Min Level</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((item) => {
                const status = statusConfig[item.stockStatus] ?? statusConfig.OK;
                return (
                  <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4 font-medium">{item.ingredient.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.branch?.name ?? 'Central HQ'}</td>
                    <td className="px-6 py-4 font-mono font-medium">
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono">
                      {item.minStockLevel} {item.unit}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openAdjust(item)}>
                        Adjust Stock
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {showAdjustModal && adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Adjust Stock: {adjustTarget.ingredient.name}</h2>
              <button onClick={closeAdjustModal} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              {error && <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md px-4 py-2">{error}</div>}

              <div className="space-y-1">
                <label className="text-sm font-medium">Adjustment Type</label>
                <select
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={adjustForm.type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value as StockMovementType })}
                  disabled={isBusy}
                >
                  <option value="ADJUSTMENT">General Adjustment</option>
                  <option value="PURCHASE_RECEIPT">Purchase Receipt</option>
                  <option value="KITCHEN_USAGE">Kitchen Usage</option>
                  <option value="WASTAGE">Wastage / Spoilage</option>
                  <option value="RETURN">Supplier Return</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Quantity Change ({adjustTarget.unit}) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. 10 to add, -5 to subtract"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                  disabled={isBusy}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter a positive number to add stock, or a negative number to reduce stock.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Notes / Reason</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="Reason for adjustment"
                  value={adjustForm.note}
                  onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })}
                  disabled={isBusy}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeAdjustModal} disabled={isBusy}>Cancel</Button>
                <Button type="submit" disabled={isBusy}>{isBusy ? 'Saving...' : 'Apply Adjustment'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Track New Ingredient Modal */}
      {showNewItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Track New Ingredient in Inventory</h2>
              <button onClick={closeNewItemModal} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleNewItemSubmit} className="space-y-4">
              {error && <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md px-4 py-2">{error}</div>}

              <div className="space-y-1">
                <label className="text-sm font-medium">Select Ingredient *</label>
                <select
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={newForm.ingredientId}
                  onChange={(e) => setNewForm({ ...newForm, ingredientId: e.target.value })}
                  disabled={isBusy}
                  required
                >
                  <option value="">-- Choose Ingredient --</option>
                  {availableIngredients.map((ing: any) => (
                    <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Initial Stock</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={newForm.currentStock}
                    onChange={(e) => setNewForm({ ...newForm, currentStock: e.target.value })}
                    disabled={isBusy}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Min Stock Level</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={newForm.minStockLevel}
                    onChange={(e) => setNewForm({ ...newForm, minStockLevel: e.target.value })}
                    disabled={isBusy}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeNewItemModal} disabled={isBusy}>Cancel</Button>
                <Button type="submit" disabled={isBusy}>{isBusy ? 'Saving...' : 'Start Tracking'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
