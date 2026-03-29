import { useState, useEffect } from 'react';
import Head from 'next/head';
import { TrendingUp, ShoppingBag, DollarSign, Package, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import Spinner from '../../components/ui/Spinner';
import { getSalesSummary } from '../../services/transaction.service';
import { useCurrency } from '../../contexts/CurrencyContext';
import toast from 'react-hot-toast';

function SaleCard({ icon: Icon, label, value, color }) {
  const p = {
    green:  { bg: 'rgba(34,197,94,0.1)',  c: 'var(--green)' },
    blue:   { bg: 'rgba(99,102,241,0.1)', c: 'var(--accent3)' },
    orange: { bg: 'rgba(245,158,11,0.1)', c: 'var(--orange)' },
    purple: { bg: 'rgba(168,85,247,0.1)', c: 'var(--purple)' },
  }[color] || { bg: 'rgba(99,102,241,0.1)', c: 'var(--accent3)' };

  return (
    <div className="card p-4 transition-all duration-200"
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: p.bg }}>
          <Icon size={18} style={{ color: p.c }} />
        </div>
        <ArrowUpRight size={14} style={{ color: 'var(--text3)' }} />
      </div>
      <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>{value}</p>
      <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text3)' }}>{label}</p>
    </div>
  );
}

function ChartTooltip({ active, payload, label, formatFn }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-lg">
      <p className="font-bold mb-1" style={{ color: 'var(--text)' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{formatFn(p.value)}</strong>
        </p>
      ))}
    </div>
  );
}

export default function SalesPage() {
  const { formatFull, format } = useCurrency();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSalesSummary()
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load sales data.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Sales — StockWise</title></Head>

        <div className="mb-5">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Sales Overview</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text2)' }}>Revenue and top products</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
        ) : (
          <div className="space-y-5 animate-ios-in">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <SaleCard icon={DollarSign}  label="Total Revenue" value={formatFull(data?.sales?.total_revenue || 0)}  color="green" />
              <SaleCard icon={TrendingUp}  label="Last 30 Days"  value={formatFull(data?.sales?.revenue_30d || 0)}    color="blue" />
              <SaleCard icon={ShoppingBag} label="Transactions"  value={data?.sales?.total_transactions || 0}          color="orange" />
              <SaleCard icon={Package}     label="Units Sold"    value={data?.sales?.total_units_sold || 0}            color="purple" />
            </div>

            {/* Revenue trend */}
            <div className="card p-5">
              <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>
                Revenue — Last 30 Days
              </h3>
              {data?.trend?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={data.trend} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--surface3)" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text3)', fontSize: 10 }}
                      tickFormatter={d => d?.slice(5)} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }}
                      axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip formatFn={format} />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue"
                      stroke="#22c55e" strokeWidth={2.5} fill="url(#rev)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-40" style={{ color: 'var(--text3)' }}>
                  <ShoppingBag size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">No sales yet. Record your first sale in Inventory!</p>
                </div>
              )}
            </div>

            {/* Top items */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Top Selling Items</h3>
              </div>
              {data?.topItems?.length > 0 ? (
                data.topItems.map((item, idx) => (
                  <div key={item.id} className="list-row">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                      style={{ background: ['#6366f1','#8b5cf6','#a855f7','#c084fc','#ddd6fe'][idx] || '#6366f1' }}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{item.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text3)' }}>
                        {item.units_sold} {item.unit} sold
                      </p>
                    </div>
                    <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--green)' }}>
                      {formatFull(item.revenue)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center py-10" style={{ color: 'var(--text3)' }}>
                  <p className="text-sm">No sales data yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
