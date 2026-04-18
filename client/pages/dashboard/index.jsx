import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, ArrowRight, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import StatsGrid from '../../components/dashboard/StatsGrid';
import LowStockTable from '../../components/dashboard/LowStockTable';
import { useDashboard } from '../../hooks/useDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { getAnalytics } from '../../services/transaction.service';
import { useCurrency } from '../../contexts/CurrencyContext';

/* ─── Chart shimmer skeleton ───────────────────────────────────────────────── */
function ChartSkeleton({ height = 220 }) {
  return (
    <div style={{ height, position: 'relative', overflow: 'hidden', borderRadius: 8 }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, var(--surface2) 25%, var(--surface3) 50%, var(--surface2) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s ease-in-out infinite',
      }} />
      {/* Fake axis lines */}
      {[0.2,0.4,0.6,0.8].map(p => (
        <div key={p} style={{
          position: 'absolute', left: 0, right: 0, bottom: `${p * 100}%`,
          height: 1, background: 'var(--border)', opacity: 0.4,
        }} />
      ))}
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  );
}

/* ─── Premium chart tooltip ─────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label, formatFn, isToday }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border2)',
      borderRadius: 10,
      padding: '10px 14px',
      boxShadow: 'var(--shadow-md)',
      minWidth: 140,
    }}>
      <p style={{ fontWeight: 700, fontSize: 11, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </p>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
            {p.name}
          </span>
          <span style={{ fontWeight: 700, fontSize: 12, color: p.color, fontVariantNumeric: 'tabular-nums' }}>
            {p.dataKey === 'revenue' ? formatFn(p.value) : `${p.value} units`}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Period selector ────────────────────────────────────────────────────────── */
const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: '7d',    label: '7 Days' },
  { key: '30d',   label: '30 Days' },
];

/* ─── Donut colors ───────────────────────────────────────────────────────────── */
const DONUT_COLORS = ['#5b5bd6','#7c7ce8','#9494f0','#3b82f6','#8b5cf6','#a855f7'];

/* ─── Main component ─────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user }           = useAuth();
  const { stats, loading } = useDashboard();
  const { format, formatFull } = useCurrency();

  const [activePeriod, setActivePeriod] = useState('today');
  const [chartData,    setChartData]    = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartVisible, setChartVisible] = useState(true);
  const chartKey = useRef(0);

  const loadChart = useCallback(async (period) => {
    // Fade out → load → fade in
    setChartVisible(false);
    setChartLoading(true);
    await new Promise(r => setTimeout(r, 150)); // wait for fade out
    try {
      const backendPeriod = period === '30d' ? '1m' : period;
      const res = await getAnalytics(backendPeriod);
      setChartData(res.data.data?.trend || []);
      chartKey.current += 1;
    } catch {
      setChartData([]);
    } finally {
      setChartLoading(false);
      setChartVisible(true);
    }
  }, []);

  useEffect(() => { loadChart(activePeriod); }, [activePeriod, loadChart]);

  // Derived values
  const isToday   = activePeriod === 'today';
  const hasData   = chartData.length >= 2;
  const hasRevenue = chartData.some(d => (d.revenue || 0) > 0);

  const xFormatter = d => {
    if (!d) return '';
    if (d.includes(':')) return d;
    return d.slice(5);
  };

  // Category donut
  const categoryData = (stats?.category_breakdown || [])
    .filter(r => parseInt(r.total_quantity) > 0)
    .slice(0, 6)
    .map(row => ({ name: row.name, value: parseInt(row.total_quantity || 0) }));
  const totalUnits = categoryData.reduce((s, d) => s + d.value, 0);

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Dashboard — StockWise</title></Head>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.4px' }}>
              Hi, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
              Here&apos;s your inventory overview
            </p>
          </div>
          <Link href="/inventory" className="btn-primary"
            style={{ height: 36, paddingLeft: 14, paddingRight: 14, fontSize: 13, flexShrink: 0 }}>
            <Plus size={15} /> Add Item
          </Link>
        </div>

        {/* ── Stats grid ───────────────────────────────────────────────── */}
        <StatsGrid stats={stats} loading={loading} />

        {/* ── Charts row ───────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginTop: 14 }}
          className="lg:grid-cols-3-1">

          {/* Stock activity chart */}
          <div className="card lg:col-span-2" style={{ padding: 20, gridColumn: 'span 2 / span 2' }}>
            {/* Chart header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', letterSpacing: '-0.2px' }}>
                  Stock Activity
                </p>
                <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                  {isToday ? 'Revenue by hour · today' : `Revenue over ${activePeriod === '7d' ? '7' : '30'} days`}
                </p>
              </div>

              {/* Period selector */}
              <div style={{
                display: 'flex', gap: 2, padding: 3,
                background: 'var(--surface2)', borderRadius: 10,
                border: '1px solid var(--border)', flexShrink: 0,
              }}>
                {PERIODS.map(({ key, label }) => (
                  <button key={key}
                    onClick={() => key !== activePeriod && setActivePeriod(key)}
                    style={{
                      padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      background: activePeriod === key ? 'var(--accent)' : 'transparent',
                      color: activePeriod === key ? '#fff' : 'var(--text3)',
                      cursor: 'pointer', transition: 'all 200ms ease',
                      border: 'none',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart body */}
            <div style={{
              opacity: chartVisible ? 1 : 0,
              transition: 'opacity 200ms ease',
              height: 210,
            }}>
              {chartLoading ? (
                <ChartSkeleton height={210} />
              ) : hasData ? (
                <ResponsiveContainer width="100%" height={210} key={`chart-${chartKey.current}`}>
                  <AreaChart
                    data={chartData}
                    margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dGradRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="var(--green)"   stopOpacity={0.22} />
                        <stop offset="100%" stopColor="var(--green)"   stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="dGradQty" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="var(--accent3)" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="var(--accent3)" stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      stroke="var(--border)"
                      strokeDasharray="0"
                      vertical={false}
                      strokeOpacity={0.5}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'var(--text3)', fontSize: 10, fontFamily: 'inherit' }}
                      tickFormatter={xFormatter}
                      axisLine={false} tickLine={false} tickMargin={10}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      yAxisId="revenue"
                      orientation="left"
                      tick={{ fill: 'var(--text3)', fontSize: 10 }}
                      axisLine={false} tickLine={false}
                      tickFormatter={v => format(v, 0)}
                      width={46} tickMargin={4}
                      domain={hasRevenue ? ['auto', 'auto'] : [0, 1]}
                    />
                    <YAxis
                      yAxisId="qty"
                      orientation="right"
                      tick={{ fill: 'var(--text3)', fontSize: 10 }}
                      axisLine={false} tickLine={false}
                      allowDecimals={false}
                      width={28} tickMargin={4}
                      className="hidden sm:block"
                    />
                    <Tooltip
                      content={<ChartTooltip isToday={isToday} formatFn={format} />}
                      cursor={{ stroke: 'var(--border2)', strokeWidth: 1, strokeDasharray: '4 2' }}
                      animationDuration={150}
                    />

                    {/* Revenue area — smooth monotoneX curve */}
                    <Area
                      yAxisId="revenue"
                      type="monotoneX"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="var(--green)"
                      strokeWidth={2}
                      fill="url(#dGradRev)"
                      dot={false}
                      activeDot={{ r: 4, fill: 'var(--green)', strokeWidth: 0, stroke: 'none' }}
                      isAnimationActive={true}
                      animationDuration={700}
                      animationEasing="ease-in-out"
                    />

                    {/* Stock added — smooth curve */}
                    <Area
                      yAxisId="qty"
                      type="monotoneX"
                      dataKey="qty_added"
                      name="Stock Added"
                      stroke="var(--accent3)"
                      strokeWidth={2}
                      fill="url(#dGradQty)"
                      dot={false}
                      activeDot={{ r: 4, fill: 'var(--accent3)', strokeWidth: 0 }}
                      isAnimationActive={true}
                      animationDuration={700}
                      animationEasing="ease-in-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{
                  height: '100%', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={20} style={{ color: 'var(--text3)', opacity: 0.5 }} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>
                    No activity in this period
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', maxWidth: 220 }}>
                    Chart updates when you record sales or add stock
                  </p>
                  <Link href="/inventory"
                    style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent3)', marginTop: 4 }}>
                    Go to Inventory →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Category donut */}
          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>By Category</p>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>Stock distribution</p>

            {loading ? (
              <div style={{ height: 160, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'var(--surface2)', animation: 'shimmer 1.4s ease-in-out infinite' }} />
              </div>
            ) : categoryData.length > 0 ? (
              <>
                <div style={{ position: 'relative', height: 150 }}>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Pie
                        data={categoryData}
                        cx="50%" cy="50%"
                        innerRadius={42} outerRadius={64}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                        isAnimationActive={true}
                        animationDuration={600}
                        animationEasing="ease-in-out">
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v, n) => [`${v} units`, n]}
                        contentStyle={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border2)',
                          borderRadius: 10, fontSize: 11, color: 'var(--text)',
                          boxShadow: 'var(--shadow-md)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none',
                  }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{totalUnits}</p>
                    <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>units</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 14 }}>
                  {categoryData.map((d, i) => {
                    const pct = totalUnits > 0 ? ((d.value / totalUnits) * 100).toFixed(0) : 0;
                    return (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flex: 1 }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: 'var(--text2)' }} className="truncate">{d.name}</span>
                        </div>
                        <div style={{ display: 'flex', items: 'center', gap: 8, flexShrink: 0 }}>
                          <div style={{
                            width: 48, height: 4, borderRadius: 99, background: 'var(--surface2)', overflow: 'hidden',
                          }}>
                            <div style={{
                              height: '100%', width: `${pct}%`,
                              background: DONUT_COLORS[i % DONUT_COLORS.length],
                              borderRadius: 99, transition: 'width 600ms ease',
                            }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: DONUT_COLORS[i % DONUT_COLORS.length], minWidth: 26, textAlign: 'right' }}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--text3)' }}>No categories yet</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Quick actions ─────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          {[
            { href: '/inventory', label: 'Manage Inventory', sub: 'Add, edit, restock items', color: 'var(--accent3)',  bg: 'var(--accent-bg)', icon: Package },
            { href: '/sales',     label: 'View Sales',       sub: 'Revenue & transaction log', color: 'var(--green)', bg: 'var(--green-bg)', icon: ShoppingCart },
          ].map(({ href, label, sub, color, bg, icon: Icon }) => (
            <Link key={href} href={href}
              className="card"
              style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, textDecoration: 'none', transition: 'all 150ms ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={17} style={{ color }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{label}</p>
                  <p style={{ fontSize: 12, color: 'var(--text3)' }}>{sub}</p>
                </div>
              </div>
              <ArrowRight size={15} style={{ color, flexShrink: 0 }} />
            </Link>
          ))}
        </div>

        {/* ── Low stock table ───────────────────────────────────────────── */}
        <div style={{ marginTop: 14 }}>
          <LowStockTable items={stats?.low_stock_items ?? []} loading={loading} />
        </div>

      </AppLayout>
    </ProtectedRoute>
  );
}
