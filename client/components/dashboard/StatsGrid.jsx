import { Package, Layers, AlertTriangle, DollarSign } from 'lucide-react';
import StatCard from '../ui/StatCard';
import Spinner from '../ui/Spinner';
import { useCurrency } from '../../contexts/CurrencyContext';
import { getTooltip } from '../../config/tooltips.config';

export default function StatsGrid({ stats, loading }) {
  const { formatFull } = useCurrency();

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
      {[...Array(4)].map((_,i) => (
        <div key={i} className="card" style={{ padding: 16, minHeight: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner />
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
      <StatCard icon={Package}       label="Total Items"     value={stats?.total_items}
        tooltip={getTooltip('totalItems')} color="blue" />
      <StatCard icon={Layers}        label="Total Stock"     value={stats?.total_quantity}
        sub="units" tooltip={getTooltip('totalStock')} color="green" />
      <StatCard icon={AlertTriangle} label="Low Stock"       value={stats?.low_stock_count}
        sub={`${stats?.out_of_stock_count ?? 0} out of stock`}
        tooltip={getTooltip('lowStock')} color="orange" />
      <StatCard icon={DollarSign}    label="Inventory Value" value={formatFull(stats?.total_value)}
        tooltip={getTooltip('inventoryValue')} color="purple" />
    </div>
  );
}
