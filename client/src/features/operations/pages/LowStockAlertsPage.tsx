import React from 'react';
import { Link } from 'react-router-dom';
import { useGetLowStockAlertsQuery } from '../api/operationsApi';
import { Button } from '../../../shared/ui/button';

const statusConfig: Record<string, { label: string; className: string }> = {
  LOW: { label: 'Low Stock', className: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30' },
  CRITICAL: { label: 'Out of Stock', className: 'bg-red-500/15 text-red-600 border-red-500/30' },
};

export const LowStockAlertsPage: React.FC = () => {
  const { data: alerts, isLoading } = useGetLowStockAlertsQuery({});

  const list = alerts ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/inventory">
          <Button variant="outline" size="sm">
            ← Back to Inventory
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-red-600 dark:text-red-500">Low Stock Alerts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ingredients currently below critical or minimum thresholds</p>
        </div>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden border-red-500/20">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="text-4xl mb-3">⚠️</div>Loading alerts...
          </div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-medium text-green-600 dark:text-green-500">All stock levels healthy!</p>
            <p className="text-sm mt-1">No ingredients are currently running low.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-red-500/5 text-muted-foreground border-b border-red-500/15">
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
                const status = statusConfig[item.stockStatus] ?? statusConfig.LOW;
                return (
                  <tr key={item.id} className="hover:bg-red-500/5 transition-colors">
                    <td className="px-6 py-4 font-medium">{item.ingredient.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.branch?.name ?? 'Central HQ'}</td>
                    <td className="px-6 py-4 font-mono font-medium text-red-600 dark:text-red-400">
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
                    <td className="px-6 py-4 text-right">
                      <Link to={`/purchases/new?preselectIngredientId=${item.ingredientId}`}>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white border-0">
                          Reorder
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
