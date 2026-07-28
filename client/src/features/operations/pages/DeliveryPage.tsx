import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetDeliveryBatchesQuery,
  useCreateDeliveryBatchMutation,
  useUpdateDeliveryBatchStatusMutation,
  type DeliveryStatus,
} from '../api/operationsApi';
import { useGetDailyMenusQuery } from '../../kitchen/api/kitchenApi';
import { Button } from '../../../shared/ui/button';

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending Assignment', className: 'bg-muted text-muted-foreground border-border' },
  ASSIGNED: { label: 'Assigned', className: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  IN_TRANSIT: { label: 'In Transit', className: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30' },
  DELIVERED: { label: 'Completed', className: 'bg-green-500/15 text-green-600 border-green-500/30' },
  FAILED: { label: 'Failed Run', className: 'bg-red-500/15 text-red-600 border-red-500/30' },
};

interface FormStop {
  customerName: string;
  address: string;
  phone: string;
}

interface NewBatchFormData {
  dailyMenuId: string;
  scheduledAt: string;
  notes: string;
  stops: FormStop[];
}

const emptyStop: FormStop = { customerName: '', address: '', phone: '' };

const emptyForm: NewBatchFormData = {
  dailyMenuId: '',
  scheduledAt: new Date(Date.now() + 864e5).toISOString().slice(0, 16), // tomorrow
  notes: '',
  stops: [{ ...emptyStop }],
};

export const DeliveryPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  const { data: batchesResponse, isLoading } = useGetDeliveryBatchesQuery({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    page,
  });
  const { data: dailyMenus } = useGetDailyMenusQuery({});
  const [createBatch, { isLoading: isCreating }] = useCreateDeliveryBatchMutation();
  const [updateBatchStatus] = useUpdateDeliveryBatchStatusMutation();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewBatchFormData>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const list = batchesResponse?.data ?? [];
  const totalPages = batchesResponse?.totalPages ?? 1;

  const handleStatusChange = (status: DeliveryStatus | 'ALL') => {
    setStatusFilter(status);
    setPage(1);
  };

  const addStopRow = () => {
    setForm({ ...form, stops: [...form.stops, { ...emptyStop }] });
  };

  const removeStopRow = (idx: number) => {
    if (form.stops.length === 1) return;
    const nextStops = form.stops.filter((_, i) => i !== idx);
    setForm({ ...form, stops: nextStops });
  };

  const handleStopChange = (idx: number, field: keyof FormStop, value: string) => {
    const nextStops = form.stops.map((stop, i) => {
      if (i === idx) return { ...stop, [field]: value };
      return stop;
    });
    setForm({ ...form, stops: nextStops });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate stops
    const validStops = form.stops.filter(s => s.customerName.trim() && s.address.trim());
    if (validStops.length === 0) {
      setError('Please add at least one valid stop with name and address.');
      return;
    }

    try {
      await createBatch({
        dailyMenuId: form.dailyMenuId || undefined,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
        notes: form.notes.trim() || undefined,
        stops: validStops.map((s, idx) => ({
          customerName: s.customerName.trim(),
          address: s.address.trim(),
          phone: s.phone.trim() || undefined,
          sortOrder: idx,
        })),
      }).unwrap();
      setShowModal(false);
      setForm(emptyForm);
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to create delivery batch.');
    }
  };

  const handleQuickStatusUpdate = async (id: string, currentStatus: DeliveryStatus) => {
    const next: Record<string, DeliveryStatus> = {
      PENDING: 'ASSIGNED',
      ASSIGNED: 'IN_TRANSIT',
      IN_TRANSIT: 'DELIVERED',
    };
    const nextStatus = next[currentStatus];
    if (!nextStatus) return;

    try {
      await updateBatchStatus({ id, status: nextStatus }).unwrap();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to update status.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Delivery Batches</h1>
          <p className="text-sm text-muted-foreground mt-1">Plan and coordinate field meal deliveries</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setError(null); setShowModal(true); }}>
          + Plan Delivery Batch
        </Button>
      </div>

      {/* Filters */}
      <div className="flex rounded-md border bg-muted/40 p-1 text-sm self-start max-w-max">
        {(['ALL', 'PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'FAILED'] as const).map((status) => (
          <button
            key={status}
            className={`px-3 py-1.5 rounded-sm transition-all ${
              statusFilter === status
                ? 'bg-background text-foreground shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => handleStatusChange(status)}
          >
            {status === 'ALL' ? 'All Batches' : status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="text-4xl mb-3">🚚</div>Loading deliveries...
          </div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="text-5xl mb-3">📍</div>
            <p className="font-medium">No delivery runs found</p>
            <p className="text-sm mt-1">Create your first delivery batch to get started</p>
            <Button className="mt-4" onClick={() => setShowModal(true)}>Plan Delivery Batch</Button>
          </div>
        ) : (
          <>
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground border-b">
                <tr>
                  <th className="px-6 py-3 font-medium">Batch Number</th>
                  <th className="px-6 py-3 font-medium">Menu Date</th>
                  <th className="px-6 py-3 font-medium">Scheduled Time</th>
                  <th className="px-6 py-3 font-medium">Stops</th>
                  <th className="px-6 py-3 font-medium">Courier</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {list.map((batch) => {
                  const status = statusConfig[batch.status] ?? statusConfig.PENDING;
                  return (
                    <tr key={batch.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium">{batch.batchNumber}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {batch.dailyMenu?.date
                          ? new Date(batch.dailyMenu.date).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {batch.scheduledAt
                          ? new Date(batch.scheduledAt).toLocaleString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="px-6 py-4 font-medium">{batch._count?.stops ?? 0} stop(s)</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {batch.assignedTo
                          ? `${batch.assignedTo.firstName} ${batch.assignedTo.lastName}`
                          : 'Unassigned'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {batch.status !== 'DELIVERED' && batch.status !== 'FAILED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickStatusUpdate(batch.id, batch.status)}
                          >
                            {batch.status === 'PENDING' && 'Assign Run'}
                            {batch.status === 'ASSIGNED' && 'Start Run'}
                            {batch.status === 'IN_TRANSIT' && 'Complete Run'}
                          </Button>
                        )}
                        <Link to={`/delivery/${batch.id}`}>
                          <Button variant="outline" size="sm">Manage</Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t bg-muted/20">
                <span className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Plan Delivery Batch Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-2xl mx-4 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Plan New Delivery Batch</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md px-4 py-2">{error}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Menu Date Context</label>
                  <select
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={form.dailyMenuId}
                    onChange={(e) => setForm({ ...form, dailyMenuId: e.target.value })}
                  >
                    <option value="">-- Choose Menu (Optional) --</option>
                    {dailyMenus?.map((menu: any) => (
                      <option key={menu.id} value={menu.id}>
                        {new Date(menu.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Scheduled Time *</label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={form.scheduledAt}
                    onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Notes / Dispatch Instructions</label>
                <input
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. Carry insulation bags, check labels."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              {/* Stops Section */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Stops / Addresses</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addStopRow}>+ Add Stop</Button>
                </div>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                  {form.stops.map((stop, idx) => (
                    <div key={idx} className="flex gap-3 items-start border p-3 rounded-lg bg-muted/20 relative group">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <input
                            className="w-full px-2.5 py-1.5 bg-background border rounded-md text-xs focus:outline-none"
                            placeholder="Customer Name *"
                            value={stop.customerName}
                            onChange={(e) => handleStopChange(idx, 'customerName', e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <input
                            className="w-full px-2.5 py-1.5 bg-background border rounded-md text-xs focus:outline-none"
                            placeholder="Phone Number"
                            value={stop.phone}
                            onChange={(e) => handleStopChange(idx, 'phone', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1 md:col-span-3">
                          <textarea
                            rows={1}
                            className="w-full px-2.5 py-1.5 bg-background border rounded-md text-xs focus:outline-none resize-none"
                            placeholder="Full delivery address *"
                            value={stop.address}
                            onChange={(e) => handleStopChange(idx, 'address', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      {form.stops.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStopRow(idx)}
                          className="text-destructive hover:bg-destructive/10 p-1.5 rounded-md self-center"
                          title="Remove stop"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={isCreating}>Cancel</Button>
                <Button type="submit" disabled={isCreating}>{isCreating ? 'Creating Batch...' : 'Create Delivery Run'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
