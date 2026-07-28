import { apiSlice } from '../../../app/api/apiSlice';

// ─── Types ─────────────────────────────────────────────────────────────────

export type StockStatus = 'OK' | 'LOW' | 'CRITICAL';
export type POStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';
export type StockMovementType = 'PURCHASE_RECEIPT' | 'KITCHEN_USAGE' | 'ADJUSTMENT' | 'WASTAGE' | 'RETURN';
export type DeliveryStatus = 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  gstin?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  ingredientId: string;
  branchId?: string | null;
  currentStock: number;
  minStockLevel: number;
  unit: string;
  lastUpdatedAt: string;
  ingredient: { id: string; name: string; unit: string };
  branch?: { id: string; name: string } | null;
  stockStatus: StockStatus;
}

export interface StockMovement {
  id: string;
  type: StockMovementType;
  quantity: number;
  note?: string | null;
  createdAt: string;
  performedBy?: { id: string; firstName: string; lastName: string } | null;
}

export interface PurchaseOrderItem {
  id: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity: number;
  ingredient: { id: string; name: string; unit: string };
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: POStatus;
  totalAmount: number;
  expectedDeliveryDate?: string | null;
  notes?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  supplier: { id: string; name: string; contactPerson?: string | null };
  branch?: { id: string; name: string } | null;
  createdBy?: { id: string; firstName: string; lastName: string } | null;
  approvedBy?: { id: string; firstName: string; lastName: string } | null;
  items?: PurchaseOrderItem[];
}

export interface DeliveryStop {
  id: string;
  customerName: string;
  address: string;
  phone?: string | null;
  status: DeliveryStatus;
  deliveredAt?: string | null;
  failureReason?: string | null;
  sortOrder: number;
}

export interface DeliveryBatch {
  id: string;
  batchNumber: string;
  status: DeliveryStatus;
  scheduledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  dailyMenu?: { id: string; date: string } | null;
  branch?: { id: string; name: string } | null;
  assignedTo?: { id: string; firstName: string; lastName: string } | null;
  stops?: DeliveryStop[];
  _count?: { stops: number };
  stopSummary?: { total: number; delivered: number; failed: number; pending: number };
}

// ─── API Slice ──────────────────────────────────────────────────────────────

export const operationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Suppliers ─────────────────────────────────────────
    getSuppliers: builder.query<Supplier[], { search?: string; isActive?: boolean }>({
      query: (params) => ({ url: '/suppliers', params }),
      providesTags: ['Supplier'],
    }),
    getSupplierById: builder.query<Supplier, string>({
      query: (id) => ({ url: `/suppliers/${id}` }),
      providesTags: (result, error, id) => [{ type: 'Supplier', id }],
    }),
    createSupplier: builder.mutation<Supplier, Partial<Supplier>>({
      query: (body) => ({ url: '/suppliers', method: 'POST', data: body }),
      invalidatesTags: ['Supplier'],
    }),
    updateSupplier: builder.mutation<Supplier, { id: string } & Partial<Supplier>>({
      query: ({ id, ...body }) => ({ url: `/suppliers/${id}`, method: 'PATCH', data: body }),
      invalidatesTags: ['Supplier'],
    }),
    deleteSupplier: builder.mutation<void, string>({
      query: (id) => ({ url: `/suppliers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Supplier'],
    }),

    // ── Inventory ─────────────────────────────────────────
    getInventoryItems: builder.query<InventoryItem[], { branchId?: string; search?: string }>({
      query: (params) => ({ url: '/inventory', params }),
      providesTags: ['Inventory'],
    }),
    getInventoryItem: builder.query<InventoryItem & { movements: StockMovement[] }, string>({
      query: (id) => ({ url: `/inventory/${id}` }),
      providesTags: (result, error, id) => [{ type: 'Inventory', id }],
    }),
    getLowStockAlerts: builder.query<InventoryItem[], { branchId?: string }>({
      query: (params) => ({ url: '/inventory/alerts', params }),
      providesTags: ['Inventory'],
    }),
    createInventoryItem: builder.mutation<InventoryItem, { ingredientId: string; unit: string; branchId?: string; currentStock?: number; minStockLevel?: number }>({
      query: (body) => ({ url: '/inventory', method: 'POST', data: body }),
      invalidatesTags: ['Inventory'],
    }),
    updateInventoryItem: builder.mutation<InventoryItem, { id: string; minStockLevel?: number; unit?: string }>({
      query: ({ id, ...body }) => ({ url: `/inventory/${id}`, method: 'PATCH', data: body }),
      invalidatesTags: ['Inventory'],
    }),
    adjustStock: builder.mutation<InventoryItem, { id: string; type: StockMovementType; quantity: number; note?: string }>({
      query: ({ id, ...body }) => ({ url: `/inventory/${id}/adjust`, method: 'POST', data: body }),
      invalidatesTags: ['Inventory'],
    }),

    // ── Purchases ─────────────────────────────────────────
    getPurchaseOrders: builder.query<{ data: PurchaseOrder[]; total: number; page: number; totalPages: number }, { status?: POStatus; supplierId?: string; page?: number }>({
      query: (params) => ({ url: '/purchases', params }),
      providesTags: ['Purchase'],
    }),
    getPurchaseOrderById: builder.query<PurchaseOrder, string>({
      query: (id) => ({ url: `/purchases/${id}` }),
      providesTags: (result, error, id) => [{ type: 'Purchase', id }],
    }),
    createPurchaseOrder: builder.mutation<PurchaseOrder, { supplierId: string; branchId?: string; expectedDeliveryDate?: string; notes?: string }>({
      query: (body) => ({ url: '/purchases', method: 'POST', data: body }),
      invalidatesTags: ['Purchase'],
    }),
    updatePurchaseOrder: builder.mutation<PurchaseOrder, { id: string; supplierId?: string; expectedDeliveryDate?: string; notes?: string }>({
      query: ({ id, ...body }) => ({ url: `/purchases/${id}`, method: 'PATCH', data: body }),
      invalidatesTags: ['Purchase'],
    }),
    submitPurchaseOrder: builder.mutation<PurchaseOrder, string>({
      query: (id) => ({ url: `/purchases/${id}/submit`, method: 'PATCH' }),
      invalidatesTags: ['Purchase'],
    }),
    approvePurchaseOrder: builder.mutation<PurchaseOrder, string>({
      query: (id) => ({ url: `/purchases/${id}/approve`, method: 'PATCH' }),
      invalidatesTags: ['Purchase'],
    }),
    receivePurchaseOrder: builder.mutation<PurchaseOrder, string>({
      query: (id) => ({ url: `/purchases/${id}/receive`, method: 'PATCH' }),
      invalidatesTags: (result, error, id) => ['Purchase', 'Inventory'],
    }),
    cancelPurchaseOrder: builder.mutation<PurchaseOrder, string>({
      query: (id) => ({ url: `/purchases/${id}/cancel`, method: 'PATCH' }),
      invalidatesTags: ['Purchase'],
    }),
    addPurchaseOrderItem: builder.mutation<PurchaseOrderItem, { id: string; ingredientId: string; quantity: number; unit: string; unitPrice: number }>({
      query: ({ id, ...body }) => ({ url: `/purchases/${id}/items`, method: 'POST', data: body }),
      invalidatesTags: ['Purchase'],
    }),
    removePurchaseOrderItem: builder.mutation<void, { id: string; itemId: string }>({
      query: ({ id, itemId }) => ({ url: `/purchases/${id}/items/${itemId}`, method: 'DELETE' }),
      invalidatesTags: ['Purchase'],
    }),

    // ── Delivery ──────────────────────────────────────────
    getDeliveryBatches: builder.query<{ data: DeliveryBatch[]; total: number; page: number; totalPages: number }, { status?: DeliveryStatus; branchId?: string; page?: number }>({
      query: (params) => ({ url: '/delivery/batches', params }),
      providesTags: ['Delivery'],
    }),
    getDeliveryBatch: builder.query<DeliveryBatch, string>({
      query: (id) => ({ url: `/delivery/batches/${id}` }),
      providesTags: (result, error, id) => [{ type: 'Delivery', id }],
    }),
    createDeliveryBatch: builder.mutation<DeliveryBatch, { dailyMenuId?: string; branchId?: string; assignedToId?: string; scheduledAt?: string; notes?: string; stops?: Array<{ customerName: string; address: string; phone?: string; sortOrder?: number }> }>({
      query: (body) => ({ url: '/delivery/batches', method: 'POST', data: body }),
      invalidatesTags: ['Delivery'],
    }),
    updateDeliveryBatchStatus: builder.mutation<DeliveryBatch, { id: string; status: DeliveryStatus }>({
      query: ({ id, status }) => ({ url: `/delivery/batches/${id}/status`, method: 'PATCH', data: { status } }),
      invalidatesTags: ['Delivery'],
    }),
    updateDeliveryStopStatus: builder.mutation<DeliveryStop, { batchId: string; stopId: string; status: DeliveryStatus; failureReason?: string }>({
      query: ({ batchId, stopId, ...body }) => ({ url: `/delivery/batches/${batchId}/stops/${stopId}`, method: 'PATCH', data: body }),
      invalidatesTags: ['Delivery'],
    }),
  }),
});

export const {
  // Suppliers
  useGetSuppliersQuery,
  useGetSupplierByIdQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  // Inventory
  useGetInventoryItemsQuery,
  useGetInventoryItemQuery,
  useGetLowStockAlertsQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useAdjustStockMutation,
  // Purchases
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useSubmitPurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
  useReceivePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useAddPurchaseOrderItemMutation,
  useRemovePurchaseOrderItemMutation,
  // Delivery
  useGetDeliveryBatchesQuery,
  useGetDeliveryBatchQuery,
  useCreateDeliveryBatchMutation,
  useUpdateDeliveryBatchStatusMutation,
  useUpdateDeliveryStopStatusMutation,
} = operationsApi;
