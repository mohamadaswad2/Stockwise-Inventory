import { useState, useEffect } from 'react';
import Head from 'next/head';
import { TrendingUp, ShoppingBag, DollarSign, Package, ArrowUpRight } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import Spinner from '../../components/ui/Spinner';
import { getSalesSummary } from '../../services/transaction.service';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';

function SaleStatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue:   'rgba(0,122,255,0.1)',
    green:  'rgba(52,199,89,0.1)',
    orange: 'rgba(255,149,0,0.1)',
    purple: 'rgba(175,82,222,0.1)',
  };
  const textColors = {
    blue: 'var(--ios-blue)', green: 'var(--ios-green)',
    orange: 'var(--ios-orange)', purple: 'var(--ios-purple)',
  };
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: colors[color] }}>
          <Icon size={18} style={{ color: textColors[color] }} />
        </div>
        <ArrowUpRight size={14} style={{ color: 'var(--ios-text3)' }} />
      </div>
      <p className="text-2xl font-bold" style={{ color: 'var(--ios-text)' }}>{value}</p>
      <p className="text-xs mt-1 font-medium" style={{ color: 'var(--ios-text2)' }}>{label}</p>
    </div>
  );
}

export default function SalesPage() {
  const { isDark } = useTheme();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSalesSummary()
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load sales data.'))
      .finally(() => setLoading(false));
  }, []);

  const axisColor = isDark ? '#3f3f46' : '#e4e4e7';
  const textColor = isDark ? '#71717a' : '#94a3b8';

  const formatRM = (v) => `RM ${Number(v || 0).toFixed(0)}`;

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Sales — StockWise</title></Head>

        <div className="mb-5">
          <h1 className="text-xl font-bold" style={{ color: 'var(--ios-text)' }}>Sales Overview</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ios-text2)' }}>Track your revenue and top products</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
        ) : (
          <div className="space-y-5 animate-ios-in">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <SaleStatCard icon={DollarSign} label="Total Revenue"    value={`RM ${Number(data?.sales?.total_revenue||0).toFixed(2)}`}  color="green" />
              <SaleStatCard icon={TrendingUp} label="Last 30 Days"     value={`RM ${Number(data?.sales?.revenue_30d||0).toFixed(2)}`}    color="blue" />
              <SaleStatCard icon={ShoppingBag} label="Transactions"    value={data?.sales?.total_transactions || 0}                       color="orange" />
              <SaleStatCard icon={Package}    label="Units Sold"       value={data?.sales?.total_units_sold || 0}                        color="purple" />
            </div>

            {/* Revenue trend */}
            <div className="card p-5">
              <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--ios-text)' }}>Revenue Trend — Last 30 Days</h3>
              {data?.trend?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={data.trend} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="var(--ios-green)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--ios-green)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={axisColor} strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: textColor, fontSize: 10 }}
                      tickFormatter={d => d?.slice(5)} />
                    <YAxis tick={{ fill: textColor, fontSize: 10 }} tickFormatter={v => `RM${v}`} />
                    <Tooltip formatter={v => [`RM ${Number(v).toFixed(2)}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="var(--ios-green)" strokeWidth={2} fill="url(#rev)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-40" style={{ color: 'var(--ios-text3)' }}>
                  <ShoppingBag size={32} className="mb-2 opacity-30" />
                  <p className="text-sm">No sales yet. Record your first sale!</p>
                </div>
              )}
            </div>

            {/* Top items */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--ios-separator)' }}>
                <h3 className="text-sm font-bold" style={{ color: 'var(--ios-text)' }}>Top Selling Items</h3>
              </div>
              {data?.topItems?.length > 0 ? (
                <div>
                  {data.topItems.map((item, idx) => (
                    <div key={item.id} className="list-row">
                      <div className="w-8 h-8 rounded-2xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: idx === 0 ? 'var(--ios-orange)' : idx === 1 ? 'var(--ios-blue)' : 'var(--ios-purple)' }}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--ios-text)' }}>{item.name}</p>
                        <p className="text-xs" style={{ color: 'var(--ios-text2)' }}>
                          {item.units_sold} {item.unit} sold
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: 'var(--ios-green)' }}>
                          RM {Number(item.revenue).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-10" style={{ color: 'var(--ios-text3)' }}>
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