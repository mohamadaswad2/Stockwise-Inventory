/**
 * StatsGrid — 4-card summary row at top of dashboard.
 */
import { Package, Layers, AlertTriangle, DollarSign } from 'lucide-react';
import StatCard from '../ui/StatCard';
import Spinner from '../ui/Spinner';

export default function StatsGrid({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 flex items-center justify-center h-24">
            <Spinner />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard icon={Package}       label="Total Items"     value={stats?.total_items}        color="blue" />
      <StatCard icon={Layers}        label="Total Stock"     value={stats?.total_quantity}      color="green" sub="units across all items" />
      <StatCard icon={AlertTriangle} label="Low Stock"       value={stats?.low_stock_count}     color="amber" sub={`${stats?.out_of_stock_count ?? 0} out of stock`} />
      <StatCard icon={DollarSign}    label="Inventory Value" value={`$${stats?.total_value}`}   color="green" />
    </div>
  );
}
