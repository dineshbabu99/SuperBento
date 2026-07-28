import React, { useState } from 'react';
import {
  useGetFinancialReportQuery,
  useGetInventoryReportQuery,
  useGetDeliveryReportQuery,
} from '../api/businessApi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'];

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'financial' | 'inventory' | 'delivery'>('financial');

  // Query dates (defaulting to last 30 days)
  const { data: financial } = useGetFinancialReportQuery({});
  const { data: inventory } = useGetInventoryReportQuery();
  const { data: delivery } = useGetDeliveryReportQuery();

  const financialSeries = financial?.series ?? [];
  const categoryBreakdown = financial?.categoriesBreakdown ?? [];
  const inventoryItems = inventory?.items ?? [];
  const deliverySummary = delivery?.stopsSummary ?? { totalStops: 0, deliveredStops: 0, failedStops: 0, successRate: 100 };

  // Prepare data for radial success gauge
  const gaugeData = [
    {
      name: 'Success Rate',
      value: deliverySummary.successRate,
      fill: deliverySummary.successRate >= 90 ? '#10b981' : '#f59e0b',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Business Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Interactive operational & financial analytics dashboards</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b gap-4 text-sm">
        <button
          className={`pb-2.5 font-medium transition-all ${
            activeTab === 'financial'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('financial')}
        >
          Profit & Loss Summary
        </button>
        <button
          className={`pb-2.5 font-medium transition-all ${
            activeTab === 'inventory'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('inventory')}
        >
          Inventory Asset Valuation
        </button>
        <button
          className={`pb-2.5 font-medium transition-all ${
            activeTab === 'delivery'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('delivery')}
        >
          Delivery Performance KPIs
        </button>
      </div>

      {/* ─── Financial Report Tab ────────────────────────────────────────── */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border p-5 rounded-lg flex flex-col justify-center">
              <span className="text-xs font-medium text-muted-foreground">Total Period Revenues</span>
              <span className="text-2xl font-bold text-green-600 mt-1">
                ₹{financial?.totals.totalRevenue.toLocaleString('en-IN') ?? '0.00'}
              </span>
            </div>
            <div className="bg-card border p-5 rounded-lg flex flex-col justify-center">
              <span className="text-xs font-medium text-muted-foreground">Total Operating Expenses</span>
              <span className="text-2xl font-bold text-red-600 mt-1">
                ₹{financial?.totals.totalExpenses.toLocaleString('en-IN') ?? '0.00'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cashflow Trends Bar Chart */}
            <div className="bg-card border rounded-lg p-5 lg:col-span-2 space-y-3">
              <h2 className="text-sm font-semibold">Comparative Cash Flows</h2>
              <div className="h-72 w-full">
                {financialSeries.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                    No series records exist.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(v: any) => `₹${v}`} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#10b981" name="Revenue (₹)" />
                      <Bar dataKey="expenses" fill="#ef4444" name="Expenses (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Expenses Breakdown Pie Chart */}
            <div className="bg-card border rounded-lg p-5 space-y-3">
              <h2 className="text-sm font-semibold">Expense Cost Breakdown</h2>
              <div className="h-72 w-full flex flex-col items-center justify-center">
                {categoryBreakdown.length === 0 ? (
                  <span className="text-muted-foreground text-xs">No expense breakdown logged.</span>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="80%">
                      <PieChart>
                        <Pie
                          data={categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any) => `₹${v}`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-2 text-[10px]">
                      {categoryBreakdown.map((entry, index) => (
                        <div key={index} className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-muted-foreground">
                            {entry.name}: <strong>₹{entry.value}</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Inventory Asset Tab ────────────────────────────────────────── */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border p-5 rounded-lg flex flex-col justify-center">
              <span className="text-xs font-medium text-muted-foreground">Total Stock Valuation Assets</span>
              <span className="text-2xl font-bold text-primary mt-1">
                ₹{inventory?.totalValuation.toLocaleString('en-IN') ?? '0.00'}
              </span>
            </div>
            <div className="bg-card border p-5 rounded-lg flex flex-col justify-center border-yellow-500/20 bg-yellow-500/5">
              <span className="text-xs font-medium text-muted-foreground">Reorder Alerts Pending</span>
              <span className="text-2xl font-bold text-yellow-600 mt-1">
                {inventory?.lowStockCount ?? 0} items
              </span>
            </div>
          </div>

          {/* Top Asset Table & Pie Value */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-card border rounded-lg p-5 lg:col-span-2 space-y-3">
              <h2 className="text-sm font-semibold">Valuation of Top Ingredients Stock</h2>
              <div className="h-72 w-full">
                {inventoryItems.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                    No active inventory tracked.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={inventoryItems} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="ingredientName" type="category" width={120} style={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: any) => `₹${v}`} />
                      <Bar dataKey="value" fill="#3b82f6" name="Total Asset Value (₹)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-card border rounded-lg p-5 space-y-3">
              <h2 className="text-sm font-semibold">Inventory Value Breakdown</h2>
              <div className="h-72 w-full flex flex-col items-center justify-center">
                {inventoryItems.length === 0 ? (
                  <span className="text-muted-foreground text-xs font-mono">No stock values.</span>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="80%">
                      <PieChart>
                        <Pie
                          data={inventoryItems}
                          cx="50%"
                          cy="50%"
                          innerRadius={0}
                          outerRadius={75}
                          dataKey="value"
                          nameKey="ingredientName"
                        >
                          {inventoryItems.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any) => `₹${v}`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-1.5 text-[9px] max-h-16 overflow-y-auto w-full">
                      {inventoryItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span className="text-muted-foreground truncate max-w-[80px]" title={item.ingredientName}>
                            {item.ingredientName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delivery Tab ────────────────────────────────────────────────── */}
      {activeTab === 'delivery' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border p-5 rounded-lg flex flex-col justify-center">
              <span className="text-xs font-medium text-muted-foreground">Total Scheduled Runs</span>
              <span className="text-2xl font-bold text-foreground mt-1">{delivery?.totalRuns ?? 0}</span>
            </div>
            <div className="bg-card border p-5 rounded-lg flex flex-col justify-center border-green-500/20 bg-green-500/5">
              <span className="text-xs font-medium text-muted-foreground">Successfully Delivered Stops</span>
              <span className="text-2xl font-bold text-green-600 mt-1">{deliverySummary.deliveredStops}</span>
            </div>
            <div className="bg-card border p-5 rounded-lg flex flex-col justify-center border-red-500/20 bg-red-500/5">
              <span className="text-xs font-medium text-muted-foreground">Failed Delivery Stops</span>
              <span className="text-2xl font-bold text-red-600 mt-1">{deliverySummary.failedStops}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery success radial gauge */}
            <div className="bg-card border rounded-lg p-5 flex flex-col items-center justify-center text-center space-y-4">
              <h2 className="text-sm font-semibold self-start">Delivery Stop Success Rate KPI</h2>
              <div className="h-48 w-48 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="70%"
                    outerRadius="100%"
                    barSize={15}
                    data={gaugeData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar background dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-foreground">{deliverySummary.successRate}%</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-1">
                    On-Time Rate
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground max-w-xs">
                Reflects the ratio of completed drops versus missed runs or failed stop logs. Target goal is 95%.
              </p>
            </div>

            {/* Logistics Status breakdown */}
            <div className="bg-card border rounded-lg p-5 flex flex-col justify-between">
              <h2 className="text-sm font-semibold border-b pb-2">Run Completion Ledger</h2>
              <div className="space-y-4 my-auto">
                {[
                  { label: 'Completed Runs', val: delivery?.completedRuns ?? 0, pct: delivery?.totalRuns ? Math.round(((delivery?.completedRuns ?? 0) / delivery.totalRuns) * 100) : 0, color: 'bg-green-500' },
                  { label: 'Failed Runs', val: delivery?.failedRuns ?? 0, pct: delivery?.totalRuns ? Math.round(((delivery?.failedRuns ?? 0) / delivery.totalRuns) * 100) : 0, color: 'bg-red-500' },
                  { label: 'Active Scheduled Runs', val: (delivery?.totalRuns ?? 0) - (delivery?.completedRuns ?? 0) - (delivery?.failedRuns ?? 0), pct: delivery?.totalRuns ? Math.round((((delivery?.totalRuns ?? 0) - (delivery?.completedRuns ?? 0) - (delivery?.failedRuns ?? 0)) / delivery.totalRuns) * 100) : 0, color: 'bg-blue-500' },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{item.label}</span>
                      <span>{item.val} run(s) ({item.pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ReportsPage;
