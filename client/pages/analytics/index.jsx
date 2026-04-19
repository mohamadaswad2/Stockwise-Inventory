import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  TrendingUp, DollarSign, ShoppingBag, BarChart2,
  Lock, Download, Package, HelpCircle,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { safeNumber } from '../../utils/safeNumber';
import { getAnalytics } from '../../services/transaction.service';
import RevenueExplainer from '../../components/analytics/RevenueExplainer';
import TransactionTypeLegend from '../../components/analytics/TransactionTypeLegend';
import toast from 'react-hot-toast';
import { getTooltip } from '../../config/tooltips.config';

/* ── Constants ──────────────────────────────────────────────────────────────── */
const PERIODS = [
  { key: 'today', label: 'Today', advanced: false },
  { key: '7d',    label: '7 Days', advanced: false },
  { key: '3m',    label: '3 Months', advanced: true },
];
const ADVANCED_PLANS = ['premium', 'deluxe'];

/* ── Chart shimmer ──────────────────────────────────────────────────────────── */
function ChartSkeleton() {
  return (
    <div style={{ height: '100%', borderRadius: 8, overflow: 'hidden', position: 'relative', minHeight: 160 }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, var(--surface2) 25%, var(--surface3) 50%, var(--surface2) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s ease-in-out infinite',
      }} />
    </div>
  );
}

/* ── Metric card ────────────────────────────────────────────────────────────── */
function MetricCard({ icon: Icon, label, value, sub, color, tooltip }) {
  const [showTip, setShowTip] = useState(false);
  const styles = {
    green:  { bg: 'var(--green-bg)',   c: 'var(--green)'   },
    blue:   { bg: 'var(--accent-bg)',  c: 'var(--accent3)' },
    orange: { bg: 'var(--orange-bg)',  c: 'var(--orange)'  },
    purple: { bg: 'var(--purple-bg)',  c: 'var(--purple)'  },
  };
  const s = styles[color] || styles.blue;

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: s.bg, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={16} style={{ color: s.c }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {label}
            </p>
            {tooltip && (
              <div style={{ position: 'relative' }}
                onMouseEnter={() => setShowTip(true)}
                onMouseLeave={() => setShowTip(false)}>
                <HelpCircle size={11} style={{ color: 'var(--text3)', opacity: 0.6, cursor: 'help' }} />
                {showTip && (
                  <div className="tooltip-content" style={{ minWidth: 160 }}>{tooltip}</div>
                )}
              </div>
            )}
          </div>
          <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.4px', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {value}
          </p>
          {sub && <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{sub}</p>}
        </div>
      </div>
    </div>
  );
}

/* ── Chart tooltip ──────────────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label, formatFn }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border2)',
      borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow-md)', minWidth: 140,
    }}>
      <p style={{ fontWeight: 700, fontSize: 11, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </p>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 4 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
            {p.name}
          </span>
          <span style={{ fontWeight: 700, fontSize: 12, color: p.color, fontVariantNumeric: 'tabular-nums' }}>
            {typeof p.value === 'number' ? formatFn(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Mobile item row (replaces table on phone) ───────────────────────────────── */
function MobileItemRow({ item, idx, formatFull }) {
  const profit    = Number(item.profit);
  const isProfit  = profit >= 0;
  const margin    = Number(item.margin_pct);
  const rankColor = idx < 3
    ? ['#f59e0b', '#94a3b8', '#b45309'][idx]
    : 'var(--text3)';

  return (
    <div style={{
      padding: '12px 16px',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      {/* Rank */}
      <div style={{
        width: 26, height: 26, borderRadius: 7, flexShrink: 0,
        background: idx < 3 ? `${rankColor}18` : 'var(--surface2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 800, color: rankColor,
      }}>{idx + 1}</div>

      {/* Item info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 3 }} className="truncate">
          {item.name}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{item.units_sold} units</span>
          <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {formatFull(item.revenue)}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99,
            background: isProfit ? 'var(--green-bg)' : 'var(--red-bg)',
            color: isProfit ? 'var(--green)' : 'var(--red)',
          }}>
            {isProfit ? '+' : ''}{formatFull(profit)}
          </span>
        </div>
      </div>

      {/* Margin pill */}
      <div style={{
        textAlign: 'right', flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4,
      }}>
        <span style={{
          fontSize: 12, fontWeight: 700,
          color: margin >= 30 ? 'var(--green)' : margin >= 10 ? 'var(--orange)' : 'var(--red)',
        }}>
          {margin}%
        </span>
        <div style={{ width: 40, height: 3, borderRadius: 99, background: 'var(--surface2)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${Math.min(100, Math.max(0, margin))}%`,
            background: margin >= 30 ? 'var(--green)' : margin >= 10 ? 'var(--orange)' : 'var(--red)',
            borderRadius: 99,
          }} />
        </div>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const { user }               = useAuth();
  const { formatFull, format } = useCurrency();
  const [period,       setPeriod]     = useState('today');
  const [data,         setData]       = useState(null);
  const [loading,      setLoading]    = useState(true);
  const [chartVisible, setChartVisible] = useState(true);
  const chartKey = useRef(0);

  const isAdvancedPlan = ADVANCED_PLANS.includes(user?.plan);

  const load = useCallback(async (p) => {
    setChartVisible(false);
    setLoading(true);
    await new Promise(r => setTimeout(r, 100));
    try {
      const res = await getAnalytics(p);
      setData(res.data.data);
      chartKey.current += 1;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
      setChartVisible(true);
    }
  }, []);

  useEffect(() => { load(period); }, [period, load]);

  const handlePeriod = (p) => {
    const pd = PERIODS.find(x => x.key === p);
    if (pd?.advanced && !isAdvancedPlan) {
      toast.error('3M analytics require Premium or Deluxe plan.');
      return;
    }
    setPeriod(p);
  };

  const s             = data?.summary;
  const revenuePeriod = safeNumber(s?.revenue_period);
  const profitPeriod  = safeNumber(s?.profit_period);
  const marginPct     = revenuePeriod > 0
    ? ((profitPeriod / revenuePeriod) * 100).toFixed(1) : 0;
  const trendData     = data?.trend || [];
  const hasChart      = trendData.length >= 2;
  const hasData       = hasChart && trendData.some(d => d.revenue > 0 || d.profit > 0 || d.cost > 0);
  const yDomain       = hasData ? ['auto', 'auto'] : [0, 1];

  const exportAnalytics = () => {
    if (!data?.topItems?.length) { toast.error('No data to export.'); return; }
    const headers = ['Item', 'SKU', 'Units', 'Revenue', 'Cost', 'Profit', 'Margin %'];
    const rows    = data.topItems.map(i => [
      `"${i.name}"`, i.sku || '', i.units_sold,
      Number(i.revenue).toFixed(2), Number(i.total_cost).toFixed(2),
      Number(i.profit).toFixed(2), i.margin_pct,
    ].join(','));
    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `analytics-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Analytics exported!');
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Analytics — StockWise</title></Head>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          {/* Top row: title */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
            <div>
              <h1 className="page-title">Analytics</h1>
              <p className="page-subtitle">Revenue, profit & sales insights</p>
            </div>
            {/* Action buttons — always on same row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <TransactionTypeLegend />
              {isAdvancedPlan && (
                <button onClick={exportAnalytics} className="btn-secondary"
                  style={{ height: 34, paddingLeft: 12, paddingRight: 12, fontSize: 12, gap: 5 }}>
                  <Download size={13} />
                  <span className="hidden sm:inline">Export</span>
                </button>
              )}
            </div>
          </div>

          {/* Period selector — pill group, never wraps */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex', padding: 3, borderRadius: 12,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              gap: 2,
            }}>
              {PERIODS.map(({ key, label, advanced }) => {
                const locked = advanced && !isAdvancedPlan;
                const active = period === key;
                return (
                  <button key={key} onClick={() => handlePeriod(key)}
                    style={{
                      padding: '6px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600,
                      background: active ? 'var(--accent)' : 'transparent',
                      color: active ? '#fff' : locked ? 'var(--text3)' : 'var(--text2)',
                      border: 'none', cursor: 'pointer', transition: 'all 180ms ease',
                      display: 'flex', alignItems: 'center', gap: 5,
                      opacity: locked ? 0.55 : 1,
                    }}>
                    {locked && <Lock size={10} />}
                    {label}
                  </button>
                );
              })}
            </div>
            {!isAdvancedPlan && (
              <Link href="/settings/billing"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 9, fontSize: 12, fontWeight: 600,
                  background: 'var(--accent-bg)', color: 'var(--accent3)',
                  border: '1px solid var(--accent-border)', textDecoration: 'none',
                }}>
                <Lock size={10} /> Unlock 3M
              </Link>
            )}
          </div>
        </div>

        {/* ── Loading state ──────────────────────────────────────────── */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
            <Spinner size="lg" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="animate-fade-in">

            {/* ── Metric cards — responsive grid ─────────────────────── */}
            {/* 1 col < 480px | 2 col 480px+ | 4 col 1024px+ */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
            }} className="sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard icon={DollarSign}  label="Revenue"      color="green"
                value={formatFull(s?.revenue_period)}
                tooltip={getTooltip('revenue')} />
              <MetricCard icon={TrendingUp}  label="Profit"       color="blue"
                value={formatFull(s?.profit_period)}
                sub={`${marginPct}% margin`}
                tooltip={getTooltip('profit')} />
              <MetricCard icon={BarChart2}   label="Cost"         color="orange"
                value={formatFull(s?.cost_period)}
                tooltip={getTooltip('cost')} />
              <MetricCard icon={ShoppingBag} label="Transactions" color="purple"
                value={s?.total_transactions || 0}
                tooltip={getTooltip('transactions')} />
            </div>

            {/* ── Revenue explainer (conditional) ────────────────────── */}
            <RevenueExplainer summary={s} />

            {/* ── Chart ─────────────────────────────────────────────── */}
            <div className="card" style={{ padding: 18 }}>
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', letterSpacing: '-0.2px' }}>
                  Revenue vs Profit vs Cost
                </p>
                <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                  {period === 'today' ? 'Hourly breakdown · today' : `${PERIODS.find(p => p.key === period)?.label} breakdown`}
                </p>
              </div>

              {/* Responsive chart height */}
              <div style={{
                height: 'clamp(160px, 40vw, 240px)',
                opacity: chartVisible ? 1 : 0,
                transition: 'opacity 180ms ease',
              }}>
                {loading ? <ChartSkeleton /> : hasChart ? (
                  <ResponsiveContainer width="100%" height="100%" key={`chart-${chartKey.current}`}>
                    <AreaChart data={trendData} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        {[
                          { id: 'aRev',    c: 'var(--green)'   },
                          { id: 'aProfit', c: 'var(--accent3)' },
                          { id: 'aCost',   c: 'var(--orange)'  },
                        ].map(({ id, c }) => (
                          <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor={c} stopOpacity={0.2} />
                            <stop offset="100%" stopColor={c} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="0" vertical={false} strokeOpacity={0.5} />
                      <XAxis dataKey="date"
                        tick={{ fill: 'var(--text3)', fontSize: 10 }}
                        tickFormatter={d => !d ? '' : d.includes(':') ? d : d.slice(5)}
                        axisLine={false} tickLine={false} tickMargin={8}
                        interval="preserveStartEnd" />
                      <YAxis
                        tick={{ fill: 'var(--text3)', fontSize: 10 }}
                        axisLine={false} tickLine={false}
                        tickFormatter={v => format(v, 0)}
                        width={46} tickMargin={4} domain={yDomain} />
                      <Tooltip
                        content={<ChartTooltip formatFn={format} />}
                        cursor={{ stroke: 'var(--border2)', strokeWidth: 1, strokeDasharray: '4 2' }}
                        animationDuration={150} />
                      {[
                        { key: 'revenue', name: 'Revenue', c: 'var(--green)',   fill: 'url(#aRev)'    },
                        { key: 'profit',  name: 'Profit',  c: 'var(--accent3)', fill: 'url(#aProfit)' },
                        { key: 'cost',    name: 'Cost',    c: 'var(--orange)',  fill: 'url(#aCost)'   },
                      ].map(({ key, name, c, fill }) => (
                        <Area key={key} type="monotoneX" dataKey={key} name={name}
                          stroke={c} strokeWidth={2} fill={fill}
                          dot={false} activeDot={{ r: 4, fill: c, strokeWidth: 0 }}
                          isAnimationActive={true} animationDuration={650} animationEasing="ease-in-out" />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <BarChart2 size={28} style={{ color: 'var(--text3)', opacity: 0.25 }} />
                    <p style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>
                      {period === 'today' ? 'No sales yet today' : 'No data for this period'}
                    </p>
                    <Link href="/inventory"
                      style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent3)' }}>
                      Record a sale →
                    </Link>
                  </div>
                )}
              </div>

              {/* Legend below chart — manual, responsive */}
              {hasChart && (
                <div style={{ display: 'flex', gap: 14, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Revenue', c: 'var(--green)'   },
                    { label: 'Profit',  c: 'var(--accent3)' },
                    { label: 'Cost',    c: 'var(--orange)'  },
                  ].map(({ label, c }) => (
                    <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text2)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ── Item Performance ───────────────────────────────────── */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '13px 16px', borderBottom: '1px solid var(--border)',
              }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Item Performance</p>
                  <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>Revenue, cost & profit per item</p>
                </div>
              </div>

              {data?.topItems?.length > 0 ? (
                <>
                  {/* ── Mobile: compact rows ─────────────────────── */}
                  <div className="block md:hidden">
                    {data.topItems.map((item, idx) => (
                      <MobileItemRow key={item.id} item={item} idx={idx} formatFull={formatFull} />
                    ))}

                    {/* Totals row — mobile */}
                    {data.topItems.length > 1 && (() => {
                      const tRev    = safeNumber(s?.revenue_period);
                      const tCost   = safeNumber(s?.cost_period);
                      const tProfit = safeNumber(s?.profit_period);
                      return (
                        <div style={{
                          padding: '12px 16px', background: 'var(--surface2)',
                          borderTop: '2px solid var(--border2)',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                          <p style={{ fontWeight: 800, fontSize: 12, color: 'var(--text)' }}>TOTAL</p>
                          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>
                              {formatFull(tRev)}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: tProfit >= 0 ? 'var(--accent3)' : 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>
                              {tProfit >= 0 ? '+' : ''}{formatFull(tProfit)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* ── Desktop: full table ───────────────────────── */}
                  <div className="hidden md:block">
                    <div className="table-scroll">
                      <table className="data-table">
                        <thead>
                          <tr>
                            {['#', 'Item', 'Units', 'Revenue', 'Cost', 'Profit', 'Margin'].map(h => (
                              <th key={h}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.topItems.map((item, idx) => {
                            const profit   = Number(item.profit);
                            const isProfit = profit >= 0;
                            const margin   = Number(item.margin_pct);
                            const rankColor = idx < 3
                              ? ['#f59e0b', '#94a3b8', '#b45309'][idx]
                              : 'var(--text3)';
                            return (
                              <tr key={item.id}>
                                <td>
                                  <span style={{
                                    width: 24, height: 24, borderRadius: 7,
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, fontWeight: 800,
                                    background: idx < 3 ? `${rankColor}18` : 'var(--surface2)',
                                    color: rankColor,
                                  }}>{idx + 1}</span>
                                </td>
                                <td>
                                  <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>{item.name}</p>
                                  {item.sku && <p style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'monospace' }}>{item.sku}</p>}
                                </td>
                                <td style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>
                                  {item.units_sold} {item.unit}
                                </td>
                                <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--green)' }}>
                                  {formatFull(item.revenue)}
                                </td>
                                <td style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--orange)' }}>
                                  {formatFull(item.total_cost)}
                                </td>
                                <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: isProfit ? 'var(--green)' : 'var(--red)' }}>
                                  {isProfit ? '+' : ''}{formatFull(profit)}
                                </td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 52, height: 4, borderRadius: 99, background: 'var(--surface2)', overflow: 'hidden', flexShrink: 0 }}>
                                      <div style={{
                                        height: '100%',
                                        width: `${Math.min(100, Math.max(0, margin))}%`,
                                        background: margin >= 30 ? 'var(--green)' : margin >= 10 ? 'var(--orange)' : 'var(--red)',
                                        borderRadius: 99,
                                      }} />
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>
                                      {margin}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {/* Totals row */}
                          {data.topItems.length > 1 && (() => {
                            const tRev    = safeNumber(s?.revenue_period);
                            const tCost   = safeNumber(s?.cost_period);
                            const tProfit = safeNumber(s?.profit_period);
                            const tUnits  = safeNumber(s?.units_period);
                            const tMargin = tRev > 0 ? ((tProfit / tRev) * 100).toFixed(1) : 0;
                            return (
                              <tr style={{ borderTop: '2px solid var(--border2)', background: 'var(--surface2)' }}>
                                <td colSpan={2} style={{ padding: '11px 14px', fontWeight: 800, fontSize: 12, color: 'var(--text)' }}>TOTAL</td>
                                <td style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>{tUnits}</td>
                                <td style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--green)' }}>{formatFull(tRev)}</td>
                                <td style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--orange)' }}>{formatFull(tCost)}</td>
                                <td style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: tProfit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                                  {tProfit >= 0 ? '+' : ''}{formatFull(tProfit)}
                                </td>
                                <td style={{ fontWeight: 800, color: 'var(--text2)' }}>{tMargin}%</td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', gap: 8 }}>
                  <Package size={28} style={{ color: 'var(--text3)', opacity: 0.25 }} />
                  <p style={{ fontSize: 13, color: 'var(--text2)' }}>No sales in this period</p>
                </div>
              )}
            </div>

            {/* ── Summary easy view ──────────────────────────────────── */}
            {data?.summary && (() => {
              const tRev    = safeNumber(s?.revenue_period);
              const tCost   = safeNumber(s?.cost_period);
              const tProfit = safeNumber(s?.profit_period);
              const margin  = tRev > 0 ? ((tProfit / tRev) * 100).toFixed(1) : 0;
              return (
                <div className="card" style={{ padding: 16 }}>
                  <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 12 }}>
                    💡 Period Summary
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                    {[
                      { label: 'Total Sales', value: formatFull(tRev),    sub: 'From customers', bg: 'var(--green-bg)',   border: 'rgba(61,214,140,0.2)',  c: 'var(--green)'   },
                      { label: 'Total Cost',  value: formatFull(tCost),   sub: 'Cost of goods',  bg: 'var(--orange-bg)',  border: 'rgba(255,139,62,0.2)',  c: 'var(--orange)'  },
                      { label: 'Net Profit',  value: (tProfit >= 0 ? '+' : '') + formatFull(tProfit), sub: `${margin}% margin`,
                        bg:     tProfit >= 0 ? 'var(--accent-bg)' : 'var(--red-bg)',
                        border: tProfit >= 0 ? 'rgba(123,123,248,0.2)' : 'rgba(242,85,90,0.2)',
                        c:      tProfit >= 0 ? 'var(--accent3)' : 'var(--red)',
                      },
                    ].map(({ label, value, sub, bg, border, c }) => (
                      <div key={label} style={{
                        padding: '12px 10px', borderRadius: 12, textAlign: 'center',
                        background: bg, border: `1px solid ${border}`,
                      }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: c, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
                          {label}
                        </p>
                        <p style={{ fontSize: 'clamp(14px, 3.5vw, 18px)', fontWeight: 800, color: c, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                          {value}
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>{sub}</p>
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
