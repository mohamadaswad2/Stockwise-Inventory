import { Package, Layers, AlertTriangle, Coins } from 'lucide-react';
import StatCard from '../ui/StatCard';
import Spinner from '../ui/Spinner';

export default function StatsGrid({ stats, loading }) {
  if (loading) return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card p-4 flex items-center justify-center h-24">
          <Spinner />
        </div>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      <StatCard icon={Package}       label="Total Items"     value={stats?.total_items}               color="blue" />
      <StatCard icon={Layers}        label="Total Stock"     value={stats?.total_quantity}            color="green"  sub="units" />
      <StatCard icon={AlertTriangle} label="Low Stock"       value={stats?.low_stock_count}           color="orange" sub={`${stats?.out_of_stock_count ?? 0} out of stock`} />
      <StatCard icon={Coins}         label="Inventory Value" value={new Intl.NumberFormat('ms-MY', {style: 'currency',currency: 'MYR',}).format(stats?.total_value || 0)}         color="purple" />
    </div>
  );
}
