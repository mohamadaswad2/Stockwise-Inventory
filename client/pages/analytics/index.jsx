/**
 * Analytics page — Sprint B
 * - Period selector: 24h / 7d / 1m / 2m / 3m / year
 * - Revenue + Profit + Cost charts
 * - Per-item breakdown table (like user's manual spreadsheet but automatic)
 * - Gated: 2m/3m/year require Premium+
 */
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  TrendingUp, DollarSign, ShoppingBag, BarChart2,
  ArrowUpRight, ArrowDownRight, Lock, Download, Package,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, LineChart, Line,
} from 'recharts';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { getAnalytics } from '../../services/transaction.service';
import toast from 'react-hot-toast';

const PERIODS = [
  { key: '24h', label: '24 Hours',  advanced: false },
  { key: '7d',  label: '7 Days',   advanced: false },
  { key: '1m',  label: '1 Month',  advanced: false },
  { key: '2m',  label: '2 Months', advanced: true },
  { key: '3m',  label: '3 Months', advanced: true },
  { key: 'year',label: '1 Year',   advanced: true },
];

const ADVANCED_PLANS = ['premium', 'deluxe'];

function MetricCard({ icon: Icon, label, value, sub, color, trend }) {
  const p = {
    green:  { bg: 'rgba(34,197,94,0.1)',  c: 'var(--green)' },
    blue:   { bg: 'rgba(99,102,241,0.1)', c: 'var(--accent3)' },
    orange: { bg: 'rgba(245,158,11,0.1)', c: 'var(--orange)' },
    red:    { bg: 'rgba(239,68,68,0.1)',  c: 'var(--red)' },
    purple: { bg: 'rgba(168,85,247,0.1)', c: 'var(--purple)' },
  }[color] || { bg: 'rgba(99,102,241,0.1)', c: 'var(--accent3)' };

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: p.bg }}>
          <Icon size={18} style={{ color: p.c }} />
        </div>
        {trend !== undefined && (
          <span className="text-xs font-bold flex items-center gap-0.5"
            style={{ color: trend >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {trend >= 0 ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black tabular-nums" style={{ color: 'var(--text)' }}>{value}</p>
      <p className="text-xs font-medium mt-1" style={{ color: 'var(--text3)' }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>{sub}</p>}
    </div>
  );
}

function ChartTooltip({ active, payload, label, formatFn }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-lg border" style={{ borderColor: 'var(--border2)' }}>
      <p className="font-bold mb-2" style={{ color: 'var(--text)' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span style={{ color: 'var(--text2)' }}>{p.name}</span>
          </span>
          <span className="font-bold" style={{ color: p.color }}>
            {typeof p.value === 'number' && p.name !== 'Units' ? formatFn(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { user }              = useAuth();
  const { formatFull, format } = useCurrency();
  const [period,  setPeriod]  = useState('1m');
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdvancedPlan = ADVANCED_PLANS.includes(user?.plan);

  const load = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await getAnalytics(p);
      setData(res.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load analytics.';
      toast.error(msg);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(period); }, [period, load]);

  const handlePeriod = (p) => {
    const pd = PERIODS.find(x => x.key === p);
    if (pd?.advanced && !isAdvancedPlan) {
      toast.error('Extended analytics require Premium or Deluxe plan.', { duration: 4000 });
      return;
    }
    setPeriod(p);
  };

  const s = data?.summary;
  const marginPct = s?.revenue_period > 0
    ? ((Number(s.profit_period) / Number(s.revenue_period)) * 100).toFixed(1)
    : 0;

  // Export analytics CSV
  const exportAnalytics = () => {
    if (!data?.topItems?.length) { toast.error('No data to export.'); return; }
    const headers = ['Item','SKU','Units Sold','Revenue','Cost','Profit','Margin %'];
    const rows = data.topItems.map(i => [
      `"${i.name}"`, i.sku||'', i.units_sold,
      Number(i.revenue).toFixed(2), Number(i.total_cost).toFixed(2),
      Number(i.profit).toFixed(2), i.margin_pct,
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `analytics-${period}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Analytics exported!');
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Analytics — StockWise</title></Head>

        {/* Header */}
        <div className="flex items-start justify-between mb-5 gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Analytics</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text2)' }}>
              Revenue, profit and sales insights
            </p>
          </div>
          {isAdvancedPlan && (
            <button onClick={exportAnalytics} className="btn-secondary text-sm flex items-center gap-2">
              <Download size={14} /> Export
            </button>
          )}
        </div>

        {/* Period selector */}
        <div className="flex flex-wrap gap-2 mb-5">
          {PERIODS.map(({ key, label, advanced }) => {
            const locked = advanced && !isAdvancedPlan;
            const active = period === key;
            return (
              <button key={key} onClick={() => handlePeriod(key)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
                style={{
                  background: active ? 'linear-gradient(135deg,var(--accent),var(--accent2))' : 'var(--surface2)',
                  color: active ? '#fff' : locked ? 'var(--text3)' : 'var(--text2)',
                  border: active ? 'none' : `1px solid var(--border)`,
                  opacity: locked ? 0.6 : 1,
                }}>
                {locked && <Lock size={11} />}
                {label}
              </button>
            );
          })}
          {!isAdvancedPlan && (
            <Link href="/settings/billing"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent3)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <Lock size={11} /> Unlock 2m, 3m, Year
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
        ) : (
          <div className="space-y-5 animate-fade-in">

            {/* Metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard icon={DollarSign}  label="Revenue"      value={formatFull(s?.revenue_period)}  color="green" />
              <MetricCard icon={TrendingUp}  label="Profit"       value={formatFull(s?.profit_period)}   color="blue"
                sub={`${marginPct}% margin`} />
              <MetricCard icon={BarChart2}   label="Cost"         value={formatFull(s?.cost_period)}     color="orange" />
              <MetricCard icon={ShoppingBag} label="Transactions" value={s?.total_transactions || 0}     color="purple" />
            </div>

            {/* Revenue + Profit + Cost chart */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                    Revenue vs Profit vs Cost
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>
                    {PERIODS.find(p => p.key === period)?.label} breakdown
                  </p>
                </div>
              </div>
              {data?.trend?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.trend} margin={{ top: 12, right: 12, left: 12, bottom: 12 }}>
                    <defs>
                      {[
                        { id: 'rev',    color: '#22c55e' },
                        { id: 'profit', color: '#6366f1' },
                        { id: 'cost',   color: '#f59e0b' },
                      ].map(({ id, color }) => (
                        <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                          <stop offset="50%" stopColor={color} stopOpacity={0.1} />
                          <stop offset="95%" stopColor={color} stopOpacity={0.01} />
                        </linearGradient>
                      ))}
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
                    <Legend 
                      iconType="circle" 
                      iconSize={8}
                      wrapperStyle={{ paddingTop: '8px' }}
                      formatter={v => <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500 }}>{v}</span>} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      name="Revenue" 
                      stroke="#22c55e" 
                      strokeWidth={3} 
                      fill="url(#rev)"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="profit"  
                      name="Profit"  
                      stroke="#6366f1" 
                      strokeWidth={2.5}   
                      fill="url(#profit)"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cost"    
                      name="Cost"    
                      stroke="#f59e0b" 
                      strokeWidth={2}   
                      fill="url(#cost)"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-40" style={{ color: 'var(--text3)' }}>
                  <BarChart2 size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">No sales data for this period.</p>
                  <Link href="/inventory" className="text-xs mt-2 font-medium" style={{ color: 'var(--accent3)' }}>
                    Record your first sale →
                  </Link>
                </div>
              )}
            </div>

            {/* Per-item breakdown — the "bill spreadsheet" user wants */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                    Item Performance Breakdown
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>
                    Revenue, cost and profit per item — sorted by revenue
                  </p>
                </div>
              </div>

              {data?.topItems?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                        {['#','Item','Units Sold','Revenue','Cost','Profit','Margin'].map(h => (
                          <th key={h} className="text-left px-4 py-3 font-bold uppercase tracking-wider whitespace-nowrap"
                            style={{ color: 'var(--text3)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.topItems.map((item, idx) => {
                        const isProfit = Number(item.profit) >= 0;
                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                            onMouseLeave={e => e.currentTarget.style.background = ''}>
                            <td className="px-4 py-3">
                              <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black"
                                style={{
                                  background: idx < 3 ? ['rgba(245,158,11,0.15)','rgba(148,163,184,0.15)','rgba(180,83,9,0.15)'][idx] : 'var(--surface3)',
                                  color: idx < 3 ? ['#f59e0b','#94a3b8','#b45309'][idx] : 'var(--text3)',
                                }}>
                                {idx + 1}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold" style={{ color: 'var(--text)' }}>{item.name}</p>
                              {item.sku && <p style={{ color: 'var(--text3)' }}>{item.sku}</p>}
                            </td>
                            <td className="px-4 py-3 font-bold tabular-nums" style={{ color: 'var(--text)' }}>
                              {item.units_sold} {item.unit}
                            </td>
                            <td className="px-4 py-3 font-bold tabular-nums" style={{ color: 'var(--green)' }}>
                              {formatFull(item.revenue)}
                            </td>
                            <td className="px-4 py-3 font-bold tabular-nums" style={{ color: 'var(--orange)' }}>
                              {formatFull(item.total_cost)}
                            </td>
                            <td className="px-4 py-3 font-bold tabular-nums"
                              style={{ color: isProfit ? 'var(--green)' : 'var(--red)' }}>
                              {isProfit ? '+' : ''}{formatFull(item.profit)}
                            </td>
                            <td className="px-4 py-3">
                              {/* Margin bar */}
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface3)' }}>
                                  <div className="h-full rounded-full"
                                    style={{
                                      width: `${Math.min(100, Math.max(0, Number(item.margin_pct)))}%`,
                                      background: Number(item.margin_pct) >= 30 ? 'var(--green)'
                                        : Number(item.margin_pct) >= 10 ? 'var(--orange)' : 'var(--red)',
                                    }} />
                                </div>
                                <span className="font-bold" style={{ color: 'var(--text2)' }}>
                                  {item.margin_pct}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Totals row */}
                      {data.topItems.length > 1 && (() => {
                        const totRev  = data.topItems.reduce((s, i) => s + Number(i.revenue), 0);
                        const totCost = data.topItems.reduce((s, i) => s + Number(i.total_cost), 0);
                        const totProfit = data.topItems.reduce((s, i) => s + Number(i.profit), 0);
                        const totUnits  = data.topItems.reduce((s, i) => s + Number(i.units_sold), 0);
                        const totMargin = totRev > 0 ? ((totProfit / totRev) * 100).toFixed(1) : 0;
                        return (
                          <tr style={{ borderTop: '2px solid var(--border2)', background: 'var(--surface2)' }}>
                            <td colSpan={2} className="px-4 py-3 font-black" style={{ color: 'var(--text)' }}>TOTAL</td>
                            <td className="px-4 py-3 font-black tabular-nums" style={{ color: 'var(--text)' }}>{totUnits}</td>
                            <td className="px-4 py-3 font-black tabular-nums" style={{ color: 'var(--green)' }}>{formatFull(totRev)}</td>
                            <td className="px-4 py-3 font-black tabular-nums" style={{ color: 'var(--orange)' }}>{formatFull(totCost)}</td>
                            <td className="px-4 py-3 font-black tabular-nums"
                              style={{ color: totProfit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                              {totProfit >= 0 ? '+' : ''}{formatFull(totProfit)}
                            </td>
                            <td className="px-4 py-3 font-black" style={{ color: 'var(--text2)' }}>{totMargin}%</td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--text3)' }}>
                  <Package size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">No sales recorded in this period.</p>
                </div>
              )}
            </div>

            {/* Summary box — easy to understand like user's spreadsheet */}
            {data?.topItems?.length > 0 && (() => {
              const totRev    = data.topItems.reduce((s, i) => s + Number(i.revenue), 0);
              const totCost   = data.topItems.reduce((s, i) => s + Number(i.total_cost), 0);
              const totProfit = data.topItems.reduce((s, i) => s + Number(i.profit), 0);
              const margin    = totRev > 0 ? ((totProfit / totRev) * 100).toFixed(1) : 0;
              return (
                <div className="card p-5">
                  <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>
                    💡 Summary (Easy View)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl text-center"
                      style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
                      <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--green)' }}>
                        Total Sales
                      </p>
                      <p className="text-2xl font-black" style={{ color: 'var(--green)' }}>{formatFull(totRev)}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text2)' }}>Money collected from customers</p>
                    </div>
                    <div className="p-4 rounded-xl text-center"
                      style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                      <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--orange)' }}>
                        Total Cost
                      </p>
                      <p className="text-2xl font-black" style={{ color: 'var(--orange)' }}>{formatFull(totCost)}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text2)' }}>Money spent to buy stock</p>
                    </div>
                    <div className="p-4 rounded-xl text-center"
                      style={{
                        background: totProfit >= 0 ? 'rgba(99,102,241,0.08)' : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${totProfit >= 0 ? 'rgba(99,102,241,0.15)' : 'rgba(239,68,68,0.15)'}`,
                      }}>
                      <p className="text-xs font-bold uppercase tracking-wide mb-1"
                        style={{ color: totProfit >= 0 ? 'var(--accent3)' : 'var(--red)' }}>
                        Net Profit
                      </p>
                      <p className="text-2xl font-black"
                        style={{ color: totProfit >= 0 ? 'var(--accent3)' : 'var(--red)' }}>
                        {totProfit >= 0 ? '+' : ''}{formatFull(totProfit)}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text2)' }}>
                        Sales − Cost = <strong>{margin}% margin</strong>
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-center mt-4" style={{ color: 'var(--text3)' }}>
                    Formula: <strong style={{ color: 'var(--text)' }}>Profit = Revenue − Cost</strong>
                    {' · '}
                    <strong style={{ color: 'var(--text)' }}>Margin = Profit ÷ Revenue × 100%</strong>
                  </p>
                </div>
              );
            })()}

          </div>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
