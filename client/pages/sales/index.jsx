import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { DollarSign, ShoppingBag, TrendingUp, Package, ArrowRight, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import PremiumAreaChart from '../../components/charts/PremiumAreaChart';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import Spinner from '../../components/ui/Spinner';
import { getSalesSummary } from '../../services/transaction.service';
import { useCurrency } from '../../contexts/CurrencyContext';

function ChartTooltip({ active, payload, label, formatFn }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-lg" style={{ border: '1px solid var(--border2)' }}>
      <p className="font-bold mb-1.5" style={{ color: 'var(--text)' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span style={{ color: 'var(--text2)' }}>{p.name}</span>
          </span>
          <span className="font-bold" style={{ color: p.color }}>{formatFn(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function SalesPage() {
  const { formatFull, format } = useCurrency();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSalesSummary('1m')
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load sales data.'))
      .finally(() => setLoading(false));
  }, []);

  const s        = data?.sales;
  const topItems = data?.topItems || [];
  const trend    = data?.trend    || [];
  const totRev   = Number(s?.total_revenue    || 0);
  const totRev30 = Number(s?.revenue_30d      || 0);
  const totUnits = Number(s?.total_units_sold || 0);
  const totTx    = Number(s?.total_transactions || 0);

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Sales — StockWise</title></Head>

        <div className="flex items-start justify-between mb-5 gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Sales</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text2)' }}>Last 30 days overview</p>
          </div>
          <Link href="/analytics" className="btn-secondary text-sm flex items-center gap-2">
            <BarChart2 size={14} /> Full Analytics
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
        ) : (
          <div className="space-y-5 animate-ios-in">

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: DollarSign,  label: 'Total Revenue', value: formatFull(totRev),    bg: 'rgba(34,197,94,0.12)',  c: 'var(--green)' },
                { icon: TrendingUp,  label: 'Last 30 Days',  value: formatFull(totRev30),  bg: 'rgba(99,102,241,0.12)', c: 'var(--accent3)' },
                { icon: ShoppingBag, label: 'Transactions',  value: totTx,                  bg: 'rgba(245,158,11,0.12)', c: 'var(--orange)' },
                { icon: Package,     label: 'Units Sold',    value: totUnits,               bg: 'rgba(168,85,247,0.12)', c: 'var(--purple)' },
              ].map(({ icon: Icon, label, value, bg, c }) => (
                <div key={label} className="card p-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
                    <Icon size={17} style={{ color: c }} />
                  </div>
                  <p className="text-2xl font-black tabular-nums" style={{ color: 'var(--text)' }}>{value}</p>
                  <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text3)' }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Revenue chart */}
            <div className="card p-5">
              <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>
                Revenue — Last 30 Days
              </h3>
              <PremiumAreaChart
                data={trend}
                series={[
                  { key: 'revenue', name: 'Revenue', color: 'var(--green)'   },
                  { key: 'profit',  name: 'Profit',  color: 'var(--accent3)' },
                  { key: 'cost',    name: 'Cost',     color: 'var(--orange)'  },
                ]}
                formatY={v => format(v, 0)}
                height={200}
                chartKey="sales-trend"
                showLegend={true}
              />
            </div>

            {/* Top items */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Top Selling Items</h3>
                <Link href="/analytics" className="text-xs font-semibold flex items-center gap-1"
                  style={{ color: 'var(--accent3)' }}>
                  Full breakdown <ArrowRight size={12} />
                </Link>
              </div>
              {topItems.length > 0 ? topItems.slice(0, 5).map((item, idx) => (
                <div key={item.id} className="list-row">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                    style={{ background: ['var(--orange-bg)','var(--surface3)','var(--orange-bg)','var(--accent-bg)','var(--purple-bg)'][idx] || 'var(--surface3)' }}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{item.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text3)' }}>{item.units_sold} {item.unit} sold</p>
                  </div>
                  <span className="text-sm font-bold tabular-nums flex-shrink-0" style={{ color: 'var(--green)' }}>
                    {formatFull(item.revenue)}
                  </span>
                </div>
              )) : (
                <div className="flex items-center justify-center py-10" style={{ color: 'var(--text3)' }}>
                  <p className="text-sm">No sales data yet.</p>
                </div>
              )}
            </div>

            {/* CTA */}
            <Link href="/analytics"
              className="card p-4 flex items-center justify-between transition-all duration-200"
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.12)' }}>
                  <BarChart2 size={18} style={{ color: 'var(--accent3)' }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>View Full Analytics</p>
                  <p className="text-xs" style={{ color: 'var(--text2)' }}>Profit breakdown, period comparison, export</p>
                </div>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--accent3)' }} />
            </Link>

          </div>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
