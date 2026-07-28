import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  useCreatePurchaseOrderMutation,
  useGetSuppliersQuery,
} from '../api/operationsApi';
import { Button } from '../../../shared/ui/button';

export const PurchaseFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectIngredientId = searchParams.get('preselectIngredientId');

  const { data: suppliers, isLoading: isLoadingSuppliers } = useGetSuppliersQuery({ isActive: true });
  const [createPurchaseOrder, { isLoading: isCreating }] = useCreatePurchaseOrderMutation();

  const [supplierId, setSupplierId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (suppliers && suppliers.length > 0) {
      setSupplierId(suppliers[0].id);
    }
  }, [suppliers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplierId) {
      setError('Please select a supplier.');
      return;
    }

    try {
      const result = await createPurchaseOrder({
        supplierId,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        notes: notes.trim() || undefined,
      }).unwrap();

      // Redirect to the detail page where they can add line items
      const targetUrl = `/purchases/${result.id}${preselectIngredientId ? `?addIngredientId=${preselectIngredientId}` : ''}`;
      navigate(targetUrl);
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to raise purchase order. Please try again.');
    }
  };

  return (
    <div className="p-6 max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/purchases">
          <Button variant="outline" size="sm">
            ← Back to POs
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Raise Purchase Order</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Initialize a new purchase order draft</p>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md px-4 py-2">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium">Supplier *</label>
            <select
              className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              disabled={isCreating || isLoadingSuppliers}
              required
            >
              {isLoadingSuppliers ? (
                <option>Loading suppliers...</option>
              ) : suppliers?.length === 0 ? (
                <option value="">No suppliers active. Please create one first.</option>
              ) : (
                suppliers?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.contactPerson ? `(${s.contactPerson})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Expected Delivery Date (optional)</label>
            <input
              type="date"
              className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              disabled={isCreating}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Notes / Special Instructions</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="e.g. Please deliver to back warehouse gate."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link to="/purchases">
              <Button type="button" variant="outline" disabled={isCreating}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isCreating || suppliers?.length === 0}>
              {isCreating ? 'Creating Draft...' : 'Create PO Draft'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
