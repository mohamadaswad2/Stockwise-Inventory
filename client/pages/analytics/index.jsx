import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  TrendingUp, DollarSign, ShoppingBag, BarChart2,
  ArrowUpRight, ArrowDownRight, Lock, Download, Package,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { getAnalytics } from '../../services/transaction.service';
import toast from 'react-hot-toast';

const PERIODS = [
  { key: '24h',  label: '24H',    advanced: false },
  { key: '7d',   label: '7D',     advanced: false },
  { key: '1m',   label: '1M',     advanced: false },
  { key: '2m',   label: '2M',     advanced: true  },
  { key: '3m',   label: '3M',     advanced: true  },
  { key: 'year', label: 'Year',   advanced: true  },
];
const ADVANCED_PLANS = ['premium', 'deluxe'];

function MetricCard({ icon: Icon, label, value, sub, color }) {
  const p = {
    green:  { bg: 'rgba(34,197,94,0.1)',  c: 'var(--green)' },
    blue:   { bg: 'rgba(99,102,241,0.1)', c: 'var(--accent3)' },
    orange: { bg: 'rgba(245,158,11,0.1)', c: 'var(--orange)' },
    purple: { bg: 'rgba(168,85,247,0.1)', c: 'var(--purple)' },
  }[color] || { bg: 'rgba(99,102,241,0.1)', c: 'var(--accent3)' };

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: p.bg }}>
          <Icon size={18} style={{ color: p.c }} />
        </div>
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
    <div className="card px-3 py-2 text-xs shadow-lg" style={{ border: '1px solid var(--border2)' }}>
      <p className="font-bold mb-2" style={{ color: 'var(--text)' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-0.5">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span style={{ color: 'var(--text2)' }}>{p.name}</span>
          </span>
          <span className="font-bold" style={{ color: p.color }}>
            {typeof p.value === 'number' ? formatFn(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { user }               = useAuth();
  const { formatFull, format } = useCurrency();
  const [period,  setPeriod]   = useState('1m');
  const [data,    setData]     = useState(null);
  const [loading, setLoading]  = useState(true);

  const isAdvancedPlan = ADVANCED_PLANS.includes(user?.plan);

  const load = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await getAnalytics(p);
      setData(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load analytics.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(period); }, [period, load]);

  const handlePeriod = (p) => {
    const pd = PERIODS.find(x => x.key === p);
    if (pd?.advanced && !isAdvancedPlan) {
      toast.error('Extended analytics require Premium or Deluxe plan.');
      return;
    }
    setPeriod(p);
  };

  const s          = data?.summary;
  const marginPct  = s?.revenue_period > 0
    ? ((Number(s.profit_period) / Number(s.revenue_period)) * 100).toFixed(1)
    : 0;

  const exportAnalytics = () => {
    if (!data?.topItems?.length) { toast.error('No data to export.'); return; }
    const headers = ['Item','SKU','Units Sold','Revenue','Cost','Profit','Margin %'];
    const rows    = data.topItems.map(i => [
      `"${i.name}"`, i.sku || '', i.units_sold,
      Number(i.revenue).toFixed(2), Number(i.total_cost).toFixed(2),
      Number(i.profit).toFixed(2), i.margin_pct,
    ].join(','));
    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `analytics-${period}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
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
            <p className="text-sm mt-0.5" style={{ color: 'var(--text2)' }}>Revenue, profit and sales insights</p>
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: active
                    ? 'linear-gradient(135deg,var(--accent),var(--accent2))'
                    : 'var(--surface2)',
                  color: active ? '#fff' : locked ? 'var(--text3)' : 'var(--text2)',
                  border: active ? 'none' : '1px solid var(--border)',
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
              <Lock size={11} /> Unlock 2M, 3M, Year
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
        ) : (
          <div className="space-y-5 animate-fade-in">

            {/* Metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard icon={DollarSign}  label="Revenue"      value={formatFull(s?.revenue_period)} color="green" />
              <MetricCard icon={TrendingUp}  label="Profit"       value={formatFull(s?.profit_period)}  color="blue"
                sub={`${marginPct}% margin`} />
              <MetricCard icon={BarChart2}   label="Cost"         value={formatFull(s?.cost_period)}    color="orange" />
              <MetricCard icon={ShoppingBag} label="Transactions" value={s?.total_transactions || 0}    color="purple" />
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
                <div style={{ width: '100%', height: '300px', position: 'relative', overflow: 'hidden' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data.trend}
                      margin={{ top: 30, right: 40, left: 30, bottom: 30 }}>
                      <defs>
                        {[
                          { id: 'aRev',    color: '#22c55e' },
                          { id: 'aProfit', color: '#6366f1' },
                          { id: 'aCost',   color: '#f59e0b' },
                        ].map(({ id, color }) => (
                          <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={color} stopOpacity={0.12} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid 
                        stroke="var(--surface3)" 
                        strokeDasharray="2 2" 
                        strokeWidth={0.5}
                        vertical={false} 
                        horizontalDasharray="2 2"
                      />
                      <XAxis 
                        dataKey="date"
                        tick={{ fill: 'var(--text3)', fontSize: 9 }}
                        tickFormatter={d => d?.slice(5)}
                        axisLine={false} 
                        tickLine={false} 
                        tickMargin={10}
                        padding={{ left: 20, right: 20 }} />
                      <YAxis
                        tick={{ fill: 'var(--text3)', fontSize: 9 }}
                        axisLine={false} 
                        tickLine={false}
                        tickFormatter={v => format(v, 0)}
                        width={70} 
                        tickMargin={8}
                        padding={{ top: 30, bottom: 30 }}
                        domain={[0, 'dataMax + 8%']}
                        allowDataOverflow={false} />
                      <Tooltip 
                        content={<ChartTooltip formatFn={format} />}
                        cursor={{ stroke: 'var(--border2)', strokeWidth: 0.5 }} />
                      <Legend 
                        iconType="circle" 
                        iconSize={6}
                        wrapperStyle={{ paddingTop: '10px' }}
                        formatter={v => <span style={{ fontSize: 10, color: 'var(--text2)' }}>{v}</span>} />
                      <Area 
                        type="natural" 
                        dataKey="revenue" 
                        name="Revenue"
                        stroke="#22c55e" 
                        strokeWidth={2} 
                        fill="url(#aRev)" 
                        dot={false}
                        activeDot={{ r: 3, fill: '#22c55e', strokeWidth: 1 }} />
                      <Area 
                        type="natural" 
                        dataKey="profit" 
                        name="Profit"
                        stroke="#6366f1" 
                        strokeWidth={2} 
                        fill="url(#aProfit)" 
                        dot={false}
                        activeDot={{ r: 3, fill: '#6366f1', strokeWidth: 1 }} />
                      <Area 
                        type="natural" 
                        dataKey="cost" 
                        name="Cost"
                        stroke="#f59e0b" 
                        strokeWidth={2} 
                        fill="url(#aCost)" 
                        dot={false}
                        activeDot={{ r: 3, fill: '#f59e0b', strokeWidth: 1 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
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

            {/* Per-item breakdown table */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Item Performance</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>Revenue, cost and profit per item</p>
                </div>
              </div>

              {data?.topItems?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                        {['#','Item','Units','Revenue','Cost','Profit','Margin'].map(h => (
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
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface3)' }}>
                                  <div className="h-full rounded-full"
                                    style={{
                                      width: `${Math.min(100, Math.max(0, Number(item.margin_pct)))}%`,
                                      background: Number(item.margin_pct) >= 30 ? 'var(--green)'
                                        : Number(item.margin_pct) >= 10 ? 'var(--orange)' : 'var(--red)',
                                    }} />
                                </div>
                                <span className="font-bold" style={{ color: 'var(--text2)' }}>{item.margin_pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Totals row */}
                      {data.topItems.length > 1 && (() => {
                        const tRev    = data.topItems.reduce((s, i) => s + Number(i.revenue), 0);
                        const tCost   = data.topItems.reduce((s, i) => s + Number(i.total_cost), 0);
                        const tProfit = data.topItems.reduce((s, i) => s + Number(i.profit), 0);
                        const tUnits  = data.topItems.reduce((s, i) => s + Number(i.units_sold), 0);
                        const tMargin = tRev > 0 ? ((tProfit / tRev) * 100).toFixed(1) : 0;
                        return (
                          <tr style={{ borderTop: '2px solid var(--border2)', background: 'var(--surface2)' }}>
                            <td colSpan={2} className="px-4 py-3 font-black" style={{ color: 'var(--text)' }}>TOTAL</td>
                            <td className="px-4 py-3 font-black tabular-nums" style={{ color: 'var(--text)' }}>{tUnits}</td>
                            <td className="px-4 py-3 font-black tabular-nums" style={{ color: 'var(--green)' }}>{formatFull(tRev)}</td>
                            <td className="px-4 py-3 font-black tabular-nums" style={{ color: 'var(--orange)' }}>{formatFull(tCost)}</td>
                            <td className="px-4 py-3 font-black tabular-nums"
                              style={{ color: tProfit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                              {tProfit >= 0 ? '+' : ''}{formatFull(tProfit)}
                            </td>
                            <td className="px-4 py-3 font-black" style={{ color: 'var(--text2)' }}>{tMargin}%</td>
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

            {/* Easy summary */}
            {data?.topItems?.length > 0 && (() => {
              const tRev    = data.topItems.reduce((s, i) => s + Number(i.revenue), 0);
              const tCost   = data.topItems.reduce((s, i) => s + Number(i.total_cost), 0);
              const tProfit = data.topItems.reduce((s, i) => s + Number(i.profit), 0);
              const margin  = tRev > 0 ? ((tProfit / tRev) * 100).toFixed(1) : 0;
              return (
                <div className="card p-5">
                  <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>
                    💡 Summary (Easy View)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Total Sales',  value: formatFull(tRev),    sub: 'Money from customers', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.15)',  color: 'var(--green)' },
                      { label: 'Total Cost',   value: formatFull(tCost),   sub: 'Money to buy stock',   bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)', color: 'var(--orange)' },
                      { label: 'Net Profit',   value: (tProfit >= 0 ? '+' : '') + formatFull(tProfit), sub: `${margin}% margin`, bg: tProfit >= 0 ? 'rgba(99,102,241,0.08)' : 'rgba(239,68,68,0.08)', border: tProfit >= 0 ? 'rgba(99,102,241,0.15)' : 'rgba(239,68,68,0.15)', color: tProfit >= 0 ? 'var(--accent3)' : 'var(--red)' },
                    ].map(({ label, value, sub, bg, border, color }) => (
                      <div key={label} className="p-4 rounded-xl text-center"
                        style={{ background: bg, border: `1px solid ${border}` }}>
                        <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color }}>{label}</p>
                        <p className="text-2xl font-black" style={{ color }}>{value}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text2)' }}>{sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

          </div>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
