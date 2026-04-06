import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { DollarSign, ShoppingBag, TrendingUp, Package, ArrowRight, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  const [activePeriod, setActivePeriod] = useState('1d');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Realtime polling - refresh based on period
  useEffect(() => {
    const intervalMs = activePeriod === '1h' ? 30000 : // 30 seconds for 1 hour
                       activePeriod === '1d' ? 60000 : // 1 minute for 1 day
                       300000; // 5 minutes for other periods

    const interval = setInterval(() => {
      fetchSalesData();
      setLastUpdate(new Date());
    }, intervalMs);

    return () => clearInterval(interval);
  }, [activePeriod]);

  // Initial fetch and period change handler
  useEffect(() => {
    fetchSalesData();
  }, [activePeriod]);

  const fetchSalesData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSalesSummary(activePeriod);
      setData(res.data.data);
    } catch (error) {
      toast.error('Failed to load sales data.');
    } finally {
      setLoading(false);
    }
  }, [activePeriod]);

  const s        = data?.sales;
  const topItems = data?.topItems || [];
  const trend    = data?.trend    || [];
  const totRev   = Number(s?.total_revenue    || 0);  // Total Revenue (all time)
  const todayProfit = Number(s?.profit_period || s?.total_profit || 0);  // Total Profit (based on period)
  const rev30d   = Number(s?.revenue_30d       || 0);  // 30 Day Sales
  const totUnits = Number(s?.total_units_sold || 0);   // Units Sold (all time)
  const totTx    = Number(s?.total_transactions || 0); // Total Transactions (all time)

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Sales — StockWise</title></Head>

        <div className="flex items-start justify-between mb-5 gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Sales</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text2)' }}>
              {activePeriod === '1h' ? 'Last hour (realtime)' : 
               activePeriod === '1d' ? 'Last 24 hours' : 
               activePeriod === '7d' ? 'Last 7 days' :
               activePeriod === '30d' ? 'Last 30 days' : 
               'Sales overview'} • 
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
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
                { icon: TrendingUp,  label: 'Total Profit',    value: formatFull(todayProfit), bg: 'rgba(99,102,241,0.12)', c: 'var(--accent3)' },
                { icon: ShoppingBag, label: '30 Day Sales',   value: formatFull(rev30d),   bg: 'rgba(245,158,11,0.12)', c: 'var(--orange)' },
                { icon: Package,     label: 'Units Sold',    value: totUnits,            bg: 'rgba(168,85,247,0.12)', c: 'var(--purple)' },
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
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                    Revenue Trend
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>
                    {activePeriod === '1h' ? 'Last hour (realtime)' : 
                     activePeriod === '1d' ? 'Last 24 hours' : 
                     activePeriod === '7d' ? 'Last 7 days' :
                     activePeriod === '30d' ? 'Last 30 days' : 
                     'Revenue overview'}
                  </p>
                </div>
                {/* Period selector */}
                <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--surface2)' }}>
                  {[
                    { key: '1h', label: '1H' },
                    { key: '1d', label: '1D' },
                    { key: '7d', label: '7D' },
                    { key: '30d', label: '30D' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setActivePeriod(key)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150"
                      style={{
                        background: activePeriod === key
                          ? 'linear-gradient(135deg,var(--accent),var(--accent2))'
                          : 'transparent',
                        color: activePeriod === key ? '#fff' : 'var(--text2)',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {trend.length > 0 ? (
                /* KEY FIX: top:10 right:20 so line never clips */
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart
                    data={trend}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--surface3)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date"
                      tick={{ fill: 'var(--text3)', fontSize: 10 }}
                      tickFormatter={d => d?.slice(5)}
                      axisLine={false} tickLine={false} tickMargin={8}
                      interval="preserveStartEnd" />
                    <YAxis
                      tick={{ fill: 'var(--text3)', fontSize: 10 }}
                      axisLine={false} tickLine={false}
                      tickFormatter={v => format(v, 0)}
                      width={52} tickMargin={4}
                      domain={['auto', 'auto']} />
                    <Tooltip content={<ChartTooltip formatFn={format} />}
                      cursor={{ stroke: 'var(--border2)', strokeWidth: 1 }} />
                    <Area type="monotone" dataKey="revenue" name="Revenue"
                      stroke="#22c55e" strokeWidth={2.5} fill="url(#salesGrad)"
                      dot={false} activeDot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
                      isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-36" style={{ color: 'var(--text3)' }}>
                  <ShoppingBag size={28} className="mb-2 opacity-20" />
                  <p className="text-sm">No sales yet.</p>
                  <Link href="/inventory" className="text-xs mt-2 font-medium" style={{ color: 'var(--accent3)' }}>
                    Record your first sale →
                  </Link>
                </div>
              )}
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
                    style={{ background: ['#f59e0b','#94a3b8','#b45309','#6366f1','#8b5cf6'][idx] || '#6366f1' }}>
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
