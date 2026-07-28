import { apiSlice } from '../../../app/api/apiSlice';

// ─── Types ─────────────────────────────────────────────────────────────────

export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionCategory = 'SALARY' | 'INGREDIENT_PURCHASE' | 'RENT' | 'UTILITIES' | 'MARKETING' | 'CUSTOMER_BILLING' | 'OTHER';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export type PayrollStatus = 'DRAFT' | 'APPROVED' | 'PAID' | 'CANCELLED';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  status: TransactionStatus;
  referenceId?: string | null;
  notes?: string | null;
  date: string;
  performedBy?: { id: string; firstName: string; lastName: string } | null;
}

export interface FinanceSummary {
  income: number;
  expense: number;
  net: number;
}

export interface EmployeeProfile {
  id: string;
  userId: string;
  designation: string;
  department: string;
  monthlySalary: number;
  joiningDate: string;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  ifscCode?: string | null;
  isActive: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
  };
}

export interface PayrollRecord {
  id: string;
  employeeProfileId: string;
  payPeriod: string;
  basicSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  status: PayrollStatus;
  paidAt?: string | null;
  transactionId?: string | null;
  employeeProfile: {
    id: string;
    designation: string;
    department: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface FinancialReport {
  series: Array<{ date: string; revenue: number; expenses: number }>;
  categoriesBreakdown: Array<{ name: string; value: number }>;
  totals: { totalRevenue: number; totalExpenses: number };
}

export interface InventoryReport {
  totalValuation: number;
  lowStockCount: number;
  items: Array<{
    id: string;
    ingredientName: string;
    currentStock: number;
    unit: string;
    defaultCost: number;
    value: number;
  }>;
}

export interface DeliveryReport {
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  stopsSummary: {
    totalStops: number;
    deliveredStops: number;
    failedStops: number;
    successRate: number;
  };
}

// ─── API Slice ──────────────────────────────────────────────────────────────

export const businessApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Finance ──────────────────────────────────────────
    getFinanceSummary: builder.query<FinanceSummary, void>({
      query: () => ({ url: '/finance/summary' }),
      providesTags: ['Transaction'],
    }),
    getTransactions: builder.query<Transaction[], { type?: TransactionType; category?: TransactionCategory; startDate?: string; endDate?: string }>({
      query: (params) => ({ url: '/finance/transactions', params }),
      providesTags: ['Transaction'],
    }),
    getTransactionById: builder.query<Transaction, string>({
      query: (id) => ({ url: `/finance/transactions/${id}` }),
      providesTags: (result, error, id) => [{ type: 'Transaction', id }],
    }),
    createTransaction: builder.mutation<Transaction, { type: TransactionType; category: TransactionCategory; amount: number; notes?: string }>({
      query: (body) => ({ url: '/finance/transactions', method: 'POST', data: body }),
      invalidatesTags: ['Transaction'],
    }),

    // ── HR ───────────────────────────────────────────────
    getEmployees: builder.query<EmployeeProfile[], void>({
      query: () => ({ url: '/hr/employees' }),
      providesTags: ['Employee'],
    }),
    getEmployeeById: builder.query<EmployeeProfile, string>({
      query: (id) => ({ url: `/hr/employees/${id}` }),
      providesTags: (result, error, id) => [{ type: 'Employee', id }],
    }),
    upsertEmployee: builder.mutation<EmployeeProfile, { userId: string; designation: string; department: string; monthlySalary: number; joiningDate: string; bankName?: string; bankAccountNumber?: string; ifscCode?: string }>({
      query: (body) => ({ url: '/hr/employees', method: 'POST', data: body }),
      invalidatesTags: ['Employee'],
    }),

    // ── Payroll ──────────────────────────────────────────
    getPayrolls: builder.query<PayrollRecord[], { payPeriod?: string }>({
      query: (params) => ({ url: '/hr/payroll', params }),
      providesTags: ['Payroll'],
    }),
    generatePayroll: builder.mutation<{ message: string; generatedCount: number }, { payPeriod: string }>({
      query: (body) => ({ url: '/hr/payroll/generate', method: 'POST', data: body }),
      invalidatesTags: ['Payroll'],
    }),
    updatePayrollStatus: builder.mutation<PayrollRecord, { id: string; status: PayrollStatus; bonus?: number; deductions?: number }>({
      query: ({ id, ...body }) => ({ url: `/hr/payroll/${id}/status`, method: 'PATCH', data: body }),
      invalidatesTags: ['Payroll', 'Transaction'],
    }),

    // ── Reports ──────────────────────────────────────────
    getFinancialReport: builder.query<FinancialReport, { startDate?: string; endDate?: string }>({
      query: (params) => ({ url: '/reports/financial', params }),
    }),
    getInventoryReport: builder.query<InventoryReport, void>({
      query: () => ({ url: '/reports/inventory' }),
    }),
    getDeliveryReport: builder.query<DeliveryReport, void>({
      query: () => ({ url: '/reports/delivery' }),
    }),
  }),
});

export const {
  useGetFinanceSummaryQuery,
  useGetTransactionsQuery,
  useGetTransactionByIdQuery,
  useCreateTransactionMutation,
  useGetEmployeesQuery,
  useGetEmployeeByIdQuery,
  useUpsertEmployeeMutation,
  useGetPayrollsQuery,
  useGeneratePayrollMutation,
  useUpdatePayrollStatusMutation,
  useGetFinancialReportQuery,
  useGetInventoryReportQuery,
  useGetDeliveryReportQuery,
} = businessApi;
