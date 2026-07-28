import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetPurchaseOrdersQuery,
  useGetSuppliersQuery,
  type POStatus,
} from '../api/operationsApi';
import { Button } from '../../../shared/ui/button';

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-muted text-muted-foreground border-border' },
  SUBMITTED: { label: 'Submitted', className: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  APPROVED: { label: 'Approved', className: 'bg-green-500/15 text-green-600 border-green-500/30' },
  RECEIVED: { label: 'Received', className: 'bg-purple-500/15 text-purple-600 border-purple-500/30' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-500/15 text-red-600 border-red-500/30' },
};

export const PurchasesPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<POStatus | 'ALL'>('ALL');
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  const { data: suppliers } = useGetSuppliersQuery({});
  const { data: purchasesResponse, isLoading } = useGetPurchaseOrdersQuery({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    supplierId: supplierFilter === 'ALL' ? undefined : supplierFilter,
    page,
  });

  const purchases = purchasesResponse?.data ?? [];
  const totalPages = purchasesResponse?.totalPages ?? 1;

  const handleStatusChange = (status: POStatus | 'ALL') => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleSupplierChange = (supplierId: string) => {
    setSupplierFilter(supplierId);
    setPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage procurement and vendor orders</p>
        </div>
        <Link to="/purchases/new">
          <Button>+ Raise Purchase Order</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex rounded-md border bg-muted/40 p-1 text-sm">
          {(['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'RECEIVED', 'CANCELLED'] as const).map((status) => (
            <button
              key={status}
              className={`px-3 py-1.5 rounded-sm transition-all ${
                statusFilter === status
                  ? 'bg-background text-foreground shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => handleStatusChange(status)}
            >
              {status === 'ALL' ? 'All Orders' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <select
          className="px-3 py-1.5 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={supplierFilter}
          onChange={(e) => handleSupplierChange(e.target.value)}
        >
          <option value="ALL">All Suppliers</option>
          {suppliers?.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="text-4xl mb-3">🛒</div>Loading orders...
          </div>
        ) : purchases.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="text-5xl mb-3">📋</div>
            <p className="font-medium">No purchase orders found</p>
            <p className="text-sm mt-1">Change filters or raise a new purchase order</p>
            <Link to="/purchases/new" className="inline-block mt-4">
              <Button>Raise Purchase Order</Button>
            </Link>
          </div>
        ) : (
          <>
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground border-b">
                <tr>
                  <th className="px-6 py-3 font-medium">PO Number</th>
                  <th className="px-6 py-3 font-medium">Supplier</th>
                  <th className="px-6 py-3 font-medium">Raised Date</th>
                  <th className="px-6 py-3 font-medium">Expected Date</th>
                  <th className="px-6 py-3 font-medium">Total Amount</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {purchases.map((po) => {
                  const status = statusConfig[po.status] ?? statusConfig.DRAFT;
                  return (
                    <tr key={po.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium">{po.poNumber}</td>
                      <td className="px-6 py-4">{po.supplier.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(po.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {po.expectedDeliveryDate
                          ? new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-6 py-4 font-medium">₹{po.totalAmount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/purchases/${po.id}`}>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t bg-muted/20">
                <span className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
