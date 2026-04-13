import { Package, Layers, AlertTriangle, DollarSign } from 'lucide-react';
import StatCard from '../ui/StatCard';
import Spinner from '../ui/Spinner';
import { useCurrency } from '../../contexts/CurrencyContext';
import { getTooltip } from '../../config/tooltips.config';

export default function StatsGrid({ stats, loading }) {
  const { formatFull } = useCurrency();

  if (loading) return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card p-4 h-24 flex items-center justify-center">
          <Spinner />
        </div>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      <StatCard icon={Package}       label="Total Items"     value={stats?.total_items}
        tooltip={getTooltip('totalItems')}
        color="blue" />
      <StatCard icon={Layers}        label="Total Stock"     value={stats?.total_quantity}
        sub="units"
        tooltip={getTooltip('totalStock')}
        color="green" />
      <StatCard icon={AlertTriangle} label="Low Stock"       value={stats?.low_stock_count}
        sub={`${stats?.out_of_stock_count ?? 0} out of stock`}
        tooltip={getTooltip('lowStock')}
        color="orange" />
      <StatCard icon={DollarSign}    label="Inventory Value" value={formatFull(stats?.total_value)}
        tooltip={getTooltip('inventoryValue')}
        color="purple" />
    </div>
  );
}
