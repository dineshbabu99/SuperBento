import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useGetDeliveryBatchQuery,
  useUpdateDeliveryBatchStatusMutation,
  useUpdateDeliveryStopStatusMutation,
  type DeliveryStatus,
} from '../api/operationsApi';
import { Button } from '../../../shared/ui/button';

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending Assignment', className: 'bg-muted text-muted-foreground border-border' },
  ASSIGNED: { label: 'Assigned', className: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  IN_TRANSIT: { label: 'In Transit', className: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30' },
  DELIVERED: { label: 'Completed Run', className: 'bg-green-500/15 text-green-600 border-green-500/30' },
  FAILED: { label: 'Failed Run', className: 'bg-red-500/15 text-red-600 border-red-500/30' },
};

const stopStatusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-muted text-muted-foreground border-border' },
  DELIVERED: { label: 'Delivered', className: 'bg-green-500/15 text-green-600 border-green-500/30' },
  FAILED: { label: 'Failed', className: 'bg-red-500/15 text-red-600 border-red-500/30' },
};

export const DeliveryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: batch, isLoading } = useGetDeliveryBatchQuery(id!);
  const [updateBatchStatus, { isLoading: isUpdatingBatch }] = useUpdateDeliveryBatchStatusMutation();
  const [updateStopStatus, { isLoading: isUpdatingStop }] = useUpdateDeliveryStopStatusMutation();

  const [failureStopId, setFailureStopId] = useState<string | null>(null);
  const [failureReason, setFailureReason] = useState('');

  const handleBatchStatus = async (status: DeliveryStatus) => {
    try {
      await updateBatchStatus({ id: id!, status }).unwrap();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to update run status.');
    }
  };

  const handleStopStatus = async (stopId: string, status: 'DELIVERED' | 'FAILED') => {
    if (status === 'FAILED') {
      setFailureStopId(stopId);
      setFailureReason('');
      return;
    }

    try {
      await updateStopStatus({
        batchId: id!,
        stopId,
        status: 'DELIVERED',
      }).unwrap();
    } catch (err: any) {
      alert('Failed to mark stop as delivered.');
    }
  };

  const submitFailure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!failureStopId || !failureReason.trim()) return;

    try {
      await updateStopStatus({
        batchId: id!,
        stopId: failureStopId,
        status: 'FAILED',
        failureReason: failureReason.trim(),
      }).unwrap();
      setFailureStopId(null);
      setFailureReason('');
    } catch (err: any) {
      alert('Failed to log delivery failure.');
    }
  };

  if (isLoading || !batch) {
    return <div className="p-12 text-center text-muted-foreground">Loading run details...</div>;
  }

  const status = statusConfig[batch.status] ?? statusConfig.PENDING;
  const stops = batch.stops ?? [];
  const summary = batch.stopSummary ?? { total: 0, delivered: 0, failed: 0, pending: 0 };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/delivery">
          <Button variant="outline" size="sm">
            ← Back to Runs
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{batch.batchNumber}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.className}`}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Driver: {batch.assignedTo ? `${batch.assignedTo.firstName} ${batch.assignedTo.lastName}` : 'Unassigned'}
          </p>
        </div>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Stops', val: summary.total, color: 'border-border bg-card' },
          { label: 'Delivered', val: summary.delivered, color: 'border-green-500/20 bg-green-500/5 text-green-600' },
          { label: 'Failed', val: summary.failed, color: 'border-red-500/20 bg-red-500/5 text-red-600' },
          { label: 'Remaining', val: summary.pending, color: 'border-blue-500/20 bg-blue-500/5 text-blue-600' },
        ].map((item, idx) => (
          <div key={idx} className={`border rounded-lg p-4 flex flex-col justify-center ${item.color}`}>
            <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
            <span className="text-2xl font-bold leading-tight mt-1">{item.val}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stops List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold text-sm border-b pb-2">Route stops ({stops.length})</h2>

          <div className="space-y-3">
            {stops.map((stop, idx) => {
              const stopStatus = stopStatusConfig[stop.status] ?? stopStatusConfig.PENDING;
              return (
                <div key={stop.id} className="bg-card border rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold font-mono">
                        {idx + 1}
                      </span>
                      <h3 className="font-semibold text-sm">{stop.customerName}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${stopStatus.className}`}>
                        {stopStatus.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{stop.address}</p>
                    {stop.phone && <p className="text-[11px] text-muted-foreground font-mono">📞 {stop.phone}</p>}
                    {stop.status === 'FAILED' && stop.failureReason && (
                      <p className="text-[11px] text-red-600 bg-red-500/5 border border-red-500/10 p-2 rounded-md mt-2">
                        <strong>Reason:</strong> {stop.failureReason}
                      </p>
                    )}
                  </div>

                  {batch.status === 'IN_TRANSIT' && stop.status === 'PENDING' && (
                    <div className="flex gap-2 self-end md:self-center shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleStopStatus(stop.id, 'DELIVERED')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={isUpdatingStop}
                      >
                        ✓ Deliver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStopStatus(stop.id, 'FAILED')}
                        className="text-destructive border-destructive/20 hover:bg-destructive/10"
                        disabled={isUpdatingStop}
                      >
                        ✗ Fail
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Dispatch controls */}
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-5 space-y-4 shadow-sm">
            <h2 className="font-semibold text-sm border-b pb-2">Batch Operations</h2>

            <div className="text-xs text-muted-foreground space-y-2">
              <div className="flex justify-between">
                <span>Created At</span>
                <span className="font-medium text-foreground">
                  {new Date(batch.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              {batch.scheduledAt && (
                <div className="flex justify-between">
                  <span>Scheduled Run</span>
                  <span className="font-medium text-foreground">
                    {new Date(batch.scheduledAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>

            {batch.notes && (
              <div className="border-t pt-3">
                <span className="text-xs text-muted-foreground">Notes</span>
                <p className="text-xs italic text-muted-foreground mt-1">{batch.notes}</p>
              </div>
            )}

            <div className="border-t pt-4 space-y-2">
              {batch.status === 'PENDING' && (
                <Button
                  onClick={() => handleBatchStatus('ASSIGNED')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isUpdatingBatch}
                >
                  Assign to Courier
                </Button>
              )}

              {batch.status === 'ASSIGNED' && (
                <Button
                  onClick={() => handleBatchStatus('IN_TRANSIT')}
                  className="w-full"
                  disabled={isUpdatingBatch}
                >
                  Start Delivery Run
                </Button>
              )}

              {batch.status === 'IN_TRANSIT' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleBatchStatus('DELIVERED')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    disabled={isUpdatingBatch || summary.pending > 0}
                    title={summary.pending > 0 ? 'All stops must be resolved first' : ''}
                  >
                    Complete Run
                  </Button>
                  <Button
                    onClick={() => handleBatchStatus('FAILED')}
                    variant="outline"
                    className="flex-1 text-destructive border-destructive/20"
                    disabled={isUpdatingBatch}
                  >
                    Fail Run
                  </Button>
                </div>
              )}

              {batch.status === 'IN_TRANSIT' && summary.pending > 0 && (
                <p className="text-[10px] text-center text-muted-foreground mt-2">
                  Complete/Fail all stops to finalize run.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Failure Log Dialog */}
      {failureStopId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
            <h3 className="font-semibold text-base text-red-600">Log Delivery Failure</h3>
            <form onSubmit={submitFailure} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium">Reason for Failure *</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="e.g. Door locked, customer did not answer calls."
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setFailureStopId(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                  Save Log
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
