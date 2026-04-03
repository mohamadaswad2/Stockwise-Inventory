/**
 * Sales page — redesigned to be financial-focused (#18)
 * Simple, easy to understand. Links to Analytics for deep dive.
 */
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  DollarSign, ShoppingBag, TrendingUp, Package,
  ArrowRight, BarChart2, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import Spinner from '../../components/ui/Spinner';
import { getAnalytics } from '../../services/transaction.service';
import { useCurrency } from '../../contexts/CurrencyContext';

function ChartTooltip({ active, payload, label, formatFn }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-lg">
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
    getAnalytics('1m')
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load sales data.'))
      .finally(() => setLoading(false));
  }, []);

  const s          = data?.summary;
  const totRev     = Number(s?.revenue_period || 0);
  const totCost    = Number(s?.cost_period    || 0);
  const totProfit  = Number(s?.profit_period  || 0);
  const marginPct  = totRev > 0 ? ((totProfit / totRev) * 100).toFixed(1) : 0;
  const isProfit   = totProfit >= 0;

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Sales — StockWise</title></Head>

        {/* Header */}
        <div className="flex items-start justify-between mb-5 gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Sales</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text2)' }}>Last 30 days overview</p>
          </div>
          <Link href="/analytics" className="btn-secondary text-sm flex items-center gap-2">
            <BarChart2 size={14} /> Deep Analytics
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
        ) : (
          <div className="space-y-5 animate-ios-in">

            {/* Financial summary — 3 big cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Revenue */}
              <div className="card p-5"
                style={{ border: '1px solid rgba(34,197,94,0.2)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(34,197,94,0.12)' }}>
                    <DollarSign size={17} style={{ color: 'var(--green)' }} />
                  </div>
                  <span className="text-xs font-bold badge badge-green">Sales</span>
                </div>
                <p className="text-2xl font-black tabular-nums" style={{ color: 'var(--text)' }}>
                  {formatFull(totRev)}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text2)' }}>
                  Total collected from customers
                </p>
              </div>

              {/* Cost */}
              <div className="card p-5"
                style={{ border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(245,158,11,0.12)' }}>
                    <ShoppingBag size={17} style={{ color: 'var(--orange)' }} />
                  </div>
                  <span className="text-xs font-bold badge badge-yellow">Cost</span>
                </div>
                <p className="text-2xl font-black tabular-nums" style={{ color: 'var(--text)' }}>
                  {formatFull(totCost)}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text2)' }}>
                  Total cost to buy the stock
                </p>
              </div>

              {/* Profit */}
              <div className="card p-5"
                style={{ border: `1px solid ${isProfit ? 'rgba(99,102,241,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: isProfit ? 'rgba(99,102,241,0.12)' : 'rgba(239,68,68,0.12)' }}>
                    <TrendingUp size={17} style={{ color: isProfit ? 'var(--accent3)' : 'var(--red)' }} />
                  </div>
                  <span className={`text-xs font-bold badge ${isProfit ? 'badge-blue' : 'badge-red'}`}>
                    {isProfit ? `+${marginPct}% margin` : `${marginPct}% margin`}
                  </span>
                </div>
                <p className="text-2xl font-black tabular-nums"
                  style={{ color: isProfit ? 'var(--accent3)' : 'var(--red)' }}>
                  {isProfit ? '+' : ''}{formatFull(totProfit)}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text2)' }}>
                  Profit = Sales − Cost
                </p>
              </div>
            </div>

            {/* Formula explanation */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              <span className="text-base">💡</span>
              <span style={{ color: 'var(--text2)' }}>
                <strong style={{ color: 'var(--green)' }}>{formatFull(totRev)} (Sales)</strong>
                {' − '}
                <strong style={{ color: 'var(--orange)' }}>{formatFull(totCost)} (Cost)</strong>
                {' = '}
                <strong style={{ color: isProfit ? 'var(--accent3)' : 'var(--red)' }}>
                  {formatFull(totProfit)} Profit ({marginPct}% margin)
                </strong>
              </span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Transactions',  value: s?.total_transactions || 0,     icon: ShoppingBag, color: 'var(--text)' },
                { label: 'Units Sold',    value: data?.topItems?.reduce((a,i) => a + Number(i.units_sold), 0) || 0, icon: Package, color: 'var(--text)' },
                { label: 'Avg Per Sale',  value: s?.total_transactions > 0 ? formatFull(totRev / Number(s.total_transactions)) : '—', icon: DollarSign, color: 'var(--green)' },
                { label: 'Total Items',   value: data?.topItems?.length || 0,     icon: Package,    color: 'var(--text)' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="card p-3 flex items-center gap-3">
                  <Icon size={15} style={{ color: 'var(--text3)', flexShrink: 0 }} />
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: 'var(--text3)' }}>{label}</p>
                    <p className="text-sm font-bold truncate" style={{ color }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Revenue chart */}
            <div className="card p-5">
              <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>
                Revenue & Profit — Last 30 Days
              </h3>
              {data?.trend?.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={data.trend} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <defs>
                      <linearGradient id="sRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="50%" stopColor="#22c55e" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.01} />
                      </linearGradient>
                      <linearGradient id="sProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="50%" stopColor="#6366f1" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      stroke="var(--surface3)" 
                      strokeDasharray="2 2" 
                      horizontal={true}
                      vertical={false}
                      opacity={0.4}
                    />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: 'var(--text3)', fontSize: 11 }}
                      tickFormatter={d => d?.slice(5)} 
                      axisLine={false} 
                      tickLine={false}
                      minTickGap={8}
                      dy={4}
                    />
                    <YAxis 
                      tick={{ fill: 'var(--text3)', fontSize: 11 }} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={v => format(v, 0)}
                      domain={[0, 'dataMax']}
                      allowDecimals={false}
                      dx={-4}
                    />
                    <Tooltip 
                      content={<ChartTooltip formatFn={format} />}
                      cursor={{ stroke: 'var(--accent)', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      name="Revenue"
                      stroke="#22c55e" 
                      strokeWidth={3}
                      fill="url(#sRev)"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="profit" 
                      name="Profit"
                      stroke="#6366f1" 
                      strokeWidth={2.5}
                      fill="url(#sProfit)"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-40" style={{ color: 'var(--text3)' }}>
                  <ShoppingBag size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">No sales yet.</p>
                  <Link href="/inventory" className="text-xs mt-2 font-medium" style={{ color: 'var(--accent3)' }}>
                    Record your first sale →
                  </Link>
                </div>
              )}
            </div>

            {/* Top items — simplified */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Top Selling Items</h3>
                <Link href="/analytics" className="text-xs font-semibold flex items-center gap-1"
                  style={{ color: 'var(--accent3)' }}>
                  Full breakdown <ArrowRight size={12} />
                </Link>
              </div>
              {data?.topItems?.length > 0 ? (
                data.topItems.slice(0, 5).map((item, idx) => {
                  const profit  = Number(item.profit);
                  const isPos   = profit >= 0;
                  return (
                    <div key={item.id} className="list-row">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                        style={{ background: ['#f59e0b','#94a3b8','#b45309','#6366f1','#8b5cf6'][idx] || '#6366f1' }}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{item.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text3)' }}>
                          {item.units_sold} {item.unit} sold · cost {formatFull(item.total_cost)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--green)' }}>
                          {formatFull(item.revenue)}
                        </p>
                        <p className="text-xs font-semibold tabular-nums"
                          style={{ color: isPos ? 'var(--accent3)' : 'var(--red)' }}>
                          {isPos ? '+' : ''}{formatFull(profit)}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center py-10" style={{ color: 'var(--text3)' }}>
                  <p className="text-sm">No sales data yet.</p>
                </div>
              )}
            </div>

            {/* CTA to analytics */}
            <Link href="/analytics"
              className="card p-4 flex items-center justify-between group transition-all duration-200 hover:border-indigo-500/30"
              style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.12)' }}>
                  <BarChart2 size={18} style={{ color: 'var(--accent3)' }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>View Full Analytics</p>
                  <p className="text-xs" style={{ color: 'var(--text2)' }}>
                    Per-item profit breakdown, period comparison, export
                  </p>
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
