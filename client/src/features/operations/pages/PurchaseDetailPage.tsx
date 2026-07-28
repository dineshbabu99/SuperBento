import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  useGetPurchaseOrderByIdQuery,
  useSubmitPurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
  useReceivePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useAddPurchaseOrderItemMutation,
  useRemovePurchaseOrderItemMutation,
} from '../api/operationsApi';
import { useGetIngredientsQuery } from '../../kitchen/api/kitchenApi';
import { useAppSelector } from '@/app/store';
import { selectCurrentUser } from '@/features/auth/store/authSlice';
import { Button } from '../../../shared/ui/button';

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-muted text-muted-foreground border-border' },
  SUBMITTED: { label: 'Submitted for Approval', className: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  APPROVED: { label: 'Approved (Ready to Receive)', className: 'bg-green-500/15 text-green-600 border-green-500/30' },
  RECEIVED: { label: 'Received & Stocked', className: 'bg-purple-500/15 text-purple-600 border-purple-500/30' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-500/15 text-red-600 border-red-500/30' },
};

export const PurchaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const autoAddIngredientId = searchParams.get('addIngredientId');

  const currentUser = useAppSelector(selectCurrentUser);
  const isApprover = currentUser?.role?.slug === 'super-admin' || currentUser?.role?.slug === 'company-admin' || currentUser?.role?.slug === 'purchase-manager';

  const { data: po, isLoading } = useGetPurchaseOrderByIdQuery(id!);
  const { data: ingredients } = useGetIngredientsQuery({});

  const [submitPO, { isLoading: isSubmitting }] = useSubmitPurchaseOrderMutation();
  const [approvePO, { isLoading: isApproving }] = useApprovePurchaseOrderMutation();
  const [receivePO, { isLoading: isReceiving }] = useReceivePurchaseOrderMutation();
  const [cancelPO, { isLoading: isCancelling }] = useCancelPurchaseOrderMutation();
  const [addItem, { isLoading: isAddingItem }] = useAddPurchaseOrderItemMutation();
  const [removeItem, { isLoading: isRemovingItem }] = useRemovePurchaseOrderItemMutation();

  // Add Item form state
  const [ingredientId, setIngredientId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Automatically select ingredient if coming from query parameter
  useEffect(() => {
    if (autoAddIngredientId && ingredients) {
      setIngredientId(autoAddIngredientId);
      // Clean up search query param
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('addIngredientId');
      setSearchParams(newParams);
    }
  }, [autoAddIngredientId, ingredients]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!ingredientId) {
      setError('Please select an ingredient.');
      return;
    }

    const qty = parseFloat(quantity);
    const price = parseFloat(unitPrice);

    if (isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
      setError('Invalid quantity or price.');
      return;
    }

    const selectedIng = ingredients?.find((i: any) => i.id === ingredientId);
    if (!selectedIng) return;

    try {
      await addItem({
        id: id!,
        ingredientId,
        quantity: qty,
        unit: selectedIng.unit,
        unitPrice: price,
      }).unwrap();
      // Reset form
      setQuantity('');
      setUnitPrice('');
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to add item.');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Remove this item from the PO?')) return;
    try {
      await removeItem({ id: id!, itemId }).unwrap();
    } catch (err: any) {
      alert('Failed to remove item.');
    }
  };

  const handleAction = async (action: 'submit' | 'approve' | 'receive' | 'cancel') => {
    try {
      if (action === 'submit') await submitPO(id!).unwrap();
      if (action === 'approve') await approvePO(id!).unwrap();
      if (action === 'receive') await receivePO(id!).unwrap();
      if (action === 'cancel') {
        if (!confirm('Are you sure you want to cancel this PO?')) return;
        await cancelPO(id!).unwrap();
      }
    } catch (err: any) {
      alert(err?.data?.message || `Failed to perform ${action} action.`);
    }
  };

  if (isLoading || !po) {
    return <div className="p-12 text-center text-muted-foreground">Loading PO details...</div>;
  }

  const status = statusConfig[po.status] ?? statusConfig.DRAFT;
  const isDraft = po.status === 'DRAFT';
  const isSubmitted = po.status === 'SUBMITTED';
  const isApproved = po.status === 'APPROVED';
  const isCancelled = po.status === 'CANCELLED';
  const isReceived = po.status === 'RECEIVED';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/purchases">
          <Button variant="outline" size="sm">
            ← Back to POs
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{po.poNumber}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.className}`}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Supplier: {po.supplier.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metadata & Line Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Grid */}
          <div className="bg-card border rounded-lg p-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Supplier Contact</p>
              <p className="font-medium mt-0.5">{po.supplier.contactPerson ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Branch Destination</p>
              <p className="font-medium mt-0.5">{po.branch?.name ?? 'Central HQ'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expected Delivery</p>
              <p className="font-medium mt-0.5">
                {po.expectedDeliveryDate
                  ? new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className="text-lg font-bold text-primary mt-0.5">₹{po.totalAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Created By</p>
              <p className="font-medium mt-0.5">
                {po.createdBy ? `${po.createdBy.firstName} ${po.createdBy.lastName}` : '—'}
              </p>
            </div>
            {po.approvedBy && (
              <div>
                <p className="text-xs text-muted-foreground">Approved By</p>
                <p className="font-medium mt-0.5">
                  {po.approvedBy.firstName} {po.approvedBy.lastName}
                </p>
              </div>
            )}
            {po.notes && (
              <div className="col-span-full border-t pt-3">
                <p className="text-xs text-muted-foreground">Notes / Instructions</p>
                <p className="mt-1 text-muted-foreground italic">{po.notes}</p>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20">
              <h2 className="font-semibold text-sm">Line Items</h2>
            </div>

            {po.items?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No items added to this purchase order.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground border-b text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3 font-medium">Ingredient</th>
                    <th className="px-5 py-3 font-medium">Ordered Qty</th>
                    <th className="px-5 py-3 font-medium">Received Qty</th>
                    <th className="px-5 py-3 font-medium">Unit Price</th>
                    <th className="px-5 py-3 font-medium">Total Price</th>
                    {isDraft && <th className="px-5 py-3 font-medium text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {po.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-3.5 font-medium">{item.ingredient.name}</td>
                      <td className="px-5 py-3.5 font-mono">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-muted-foreground">
                        {item.receivedQuantity} {item.unit}
                      </td>
                      <td className="px-5 py-3.5 font-mono">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="px-5 py-3.5 font-mono font-medium">₹{item.totalPrice.toFixed(2)}</td>
                      {isDraft && (
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-destructive hover:underline text-xs"
                            disabled={isRemovingItem}
                          >
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Actions Panel */}
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-5 space-y-4 shadow-sm">
            <h2 className="font-semibold text-sm border-b pb-2">Order Lifecycle</h2>

            {/* Timeline progression indicators */}
            <div className="space-y-3.5 text-xs">
              {[
                { status: 'DRAFT', label: '1. PO Drafted', date: po.createdAt },
                { status: 'SUBMITTED', label: '2. Submitted for Review', date: null },
                { status: 'APPROVED', label: '3. Approved by Purchase Manager', date: po.approvedAt },
                { status: 'RECEIVED', label: '4. Goods Received & Inventory Updated', date: null },
              ].map((step, idx) => {
                const isStepPassed =
                  po.status === step.status ||
                  (step.status === 'DRAFT' && !isCancelled) ||
                  (step.status === 'SUBMITTED' && (isApproved || isReceived)) ||
                  (step.status === 'APPROVED' && isReceived);
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 border ${
                        isStepPassed
                          ? 'bg-primary border-primary shadow-glow'
                          : 'bg-transparent border-border'
                      }`}
                    />
                    <span className={isStepPassed ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                      {step.label}
                    </span>
                    {step.date && isStepPassed && (
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {new Date(step.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Form to Add Items (Draft status only) */}
            {isDraft && (
              <form onSubmit={handleAddItem} className="border-t pt-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Add Ingredient Line
                </h3>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/30 text-destructive text-[11px] rounded-md px-3 py-1.5">
                    {error}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-medium">Select Ingredient</label>
                  <select
                    className="w-full px-2.5 py-1.5 bg-background border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={ingredientId}
                    onChange={(e) => setIngredientId(e.target.value)}
                    disabled={isAddingItem}
                  >
                    <option value="">-- Choose Ingredient --</option>
                    {ingredients?.map((ing: any) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Quantity</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="w-full px-2.5 py-1.5 bg-background border rounded-md text-xs focus:outline-none"
                      placeholder="Qty"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      disabled={isAddingItem}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Unit Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full px-2.5 py-1.5 bg-background border rounded-md text-xs focus:outline-none"
                      placeholder="₹ Price"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      disabled={isAddingItem}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" size="sm" className="w-full" disabled={isAddingItem}>
                  {isAddingItem ? 'Adding...' : 'Add Item'}
                </Button>
              </form>
            )}

            {/* Workflow Action Buttons */}
            <div className="border-t pt-4 space-y-2">
              {isDraft && (
                <Button
                  onClick={() => handleAction('submit')}
                  className="w-full"
                  disabled={po.items?.length === 0 || isSubmitting}
                >
                  Submit for Approval
                </Button>
              )}

              {isSubmitted && (
                <>
                  {isApprover ? (
                    <Button
                      onClick={() => handleAction('approve')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      disabled={isApproving}
                    >
                      Approve Purchase Order
                    </Button>
                  ) : (
                    <div className="text-xs text-muted-foreground p-3 bg-muted rounded-md text-center">
                      Waiting for approval by Purchase/Company Admin.
                    </div>
                  )}
                </>
              )}

              {isApproved && (
                <Button
                  onClick={() => handleAction('receive')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={isReceiving}
                >
                  Mark as Goods Received
                </Button>
              )}

              {!isReceived && !isCancelled && (
                <Button
                  onClick={() => handleAction('cancel')}
                  variant="outline"
                  className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
                  disabled={isCancelling}
                >
                  Cancel Purchase Order
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
