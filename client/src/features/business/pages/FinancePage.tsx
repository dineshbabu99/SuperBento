import React, { useState } from 'react';
import {
  useGetFinanceSummaryQuery,
  useGetTransactionsQuery,
  useCreateTransactionMutation,
  type Transaction,
  type TransactionType,
  type TransactionCategory,
} from '../api/businessApi';
import { Button } from '../../../shared/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const typeConfig: Record<string, { label: string; className: string }> = {
  INCOME: { label: 'Income', className: 'text-green-600 bg-green-500/10 border-green-500/20' },
  EXPENSE: { label: 'Expense', className: 'text-red-600 bg-red-500/10 border-red-500/20' },
};

const categoryLabels: Record<TransactionCategory, string> = {
  SALARY: 'Salary Payout',
  INGREDIENT_PURCHASE: 'Ingredient Purchase',
  RENT: 'Rent Expense',
  UTILITIES: 'Utilities Bills',
  MARKETING: 'Marketing / Ads',
  CUSTOMER_BILLING: 'Customer billing (Revenue)',
  OTHER: 'Other / Miscellaneous',
};

export const FinancePage: React.FC = () => {
  const { data: summary, isLoading: isLoadingSummary } = useGetFinanceSummaryQuery();
  const { data: transactions, isLoading: isLoadingLedger } = useGetTransactionsQuery({});
  const [createTransaction, { isLoading: isCreating }] = useCreateTransactionMutation();

  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [category, setCategory] = useState<TransactionCategory>('INGREDIENT_PURCHASE');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Group transaction aggregates for simple visual graph
  const chartData = [...(transactions ?? [])]
    .reverse()
    .slice(0, 15) // last 15 entries
    .map((t) => ({
      date: new Date(t.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      amount: t.amount,
      type: t.type,
    }));

  const handleOpenModal = () => {
    setType('EXPENSE');
    setCategory('INGREDIENT_PURCHASE');
    setAmount('');
    setNotes('');
    setError(null);
    setShowModal(true);
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'INCOME') {
      setCategory('CUSTOMER_BILLING');
    } else {
      setCategory('INGREDIENT_PURCHASE');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    try {
      await createTransaction({
        type,
        category,
        amount: amt,
        notes: notes.trim() || undefined,
      }).unwrap();
      setShowModal(false);
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to record transaction.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Finance Ledger</h1>
          <p className="text-sm text-muted-foreground mt-1">Track financial cashflow operations</p>
        </div>
        <Button onClick={handleOpenModal}>+ Record Transaction</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: 'Total Revenue (Income)',
            value: summary?.income ?? 0,
            color: 'text-green-600 border-green-500/20 bg-green-500/5',
          },
          {
            label: 'Total Expenses',
            value: summary?.expense ?? 0,
            color: 'text-red-600 border-red-500/20 bg-red-500/5',
          },
          {
            label: 'Net Balance',
            value: summary?.net ?? 0,
            color: (summary?.net ?? 0) >= 0 
              ? 'text-primary border-primary/20 bg-primary/5' 
              : 'text-red-600 border-red-500/20 bg-red-500/5',
          },
        ].map((c, idx) => (
          <div key={idx} className={`border rounded-lg p-5 shadow-sm ${c.color}`}>
            <span className="text-xs font-medium text-muted-foreground">{c.label}</span>
            <span className="text-3xl font-bold leading-tight block mt-1">
              ₹{c.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>

      {/* Simple charts overlay */}
      {chartData.length > 0 && (
        <div className="bg-card border rounded-lg p-5">
          <h2 className="text-sm font-semibold mb-4">Cashflow Movements Trend (Recent Logs)</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: any) => `₹${value}`} />
                <Area type="monotone" dataKey="amount" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name="Amount (₹)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Transaction Ledger Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b bg-muted/20">
          <h2 className="font-semibold text-sm">Ledger Entries</h2>
        </div>

        {isLoadingLedger ? (
          <div className="p-12 text-center text-muted-foreground">Loading ledger entries...</div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No ledger transactions recorded yet.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground border-b text-xs uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Notes</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Recorder</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map((tx) => {
                const config = typeConfig[tx.type] ?? typeConfig.INCOME;
                return (
                  <tr key={tx.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                      {new Date(tx.date).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
                        {config.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-xs">{categoryLabels[tx.category] || tx.category}</td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">{tx.notes ?? '—'}</td>
                    <td className={`px-6 py-4 font-mono font-medium ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {tx.performedBy ? `${tx.performedBy.firstName} ${tx.performedBy.lastName}` : 'System'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Record Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Record Transaction Entry</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md px-4 py-2">{error}</div>}

              <div className="space-y-1">
                <label className="text-sm font-medium">Flow Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('EXPENSE')}
                    className={`py-2 text-sm border rounded-md font-medium transition-all ${
                      type === 'EXPENSE'
                        ? 'bg-red-500/10 border-red-500 text-red-600'
                        : 'bg-background hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    Expense (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('INCOME')}
                    className={`py-2 text-sm border rounded-md font-medium transition-all ${
                      type === 'INCOME'
                        ? 'bg-green-500/10 border-green-500 text-green-600'
                        : 'bg-background hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    Income (+)
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Category</label>
                <select
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                  disabled={isCreating}
                >
                  {type === 'EXPENSE' ? (
                    <>
                      <option value="INGREDIENT_PURCHASE">Ingredient Purchase</option>
                      <option value="RENT">Rent Expense</option>
                      <option value="UTILITIES">Utilities (Electricity, Water, Gas)</option>
                      <option value="SALARY">Salary / Payroll</option>
                      <option value="MARKETING">Marketing / Promotion</option>
                      <option value="OTHER">Other / Misc Expense</option>
                    </>
                  ) : (
                    <>
                      <option value="CUSTOMER_BILLING">Customer Subscription Bill</option>
                      <option value="OTHER">Other Income / Investment</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. 5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isCreating}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Notes / Context</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="Add details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isCreating}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} disabled={isCreating}>Cancel</Button>
                <Button type="submit" disabled={isCreating}>{isCreating ? 'Recording...' : 'Save Transaction'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default FinancePage;
