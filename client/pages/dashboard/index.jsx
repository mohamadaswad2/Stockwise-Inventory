import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { Plus, TrendingUp, ArrowRight, Package, ShoppingCart } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import StatsGrid from '../../components/dashboard/StatsGrid';
import LowStockTable from '../../components/dashboard/LowStockTable';
import { useDashboard } from '../../hooks/useDashboard';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../../components/ui/Spinner';

// ── Smooth custom tooltip (macam gambar contoh) ─────────────────────
function StockTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border2)',
      borderRadius: '10px',
      padding: '8px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <p style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
        {label}
      </p>
      <p style={{ color: 'var(--text)', fontSize: '15px', fontWeight: 800, margin: 0 }}>
        {payload[0]?.value} units
      </p>
    </div>
  );
}

// ── Donut chart label ────────────────────────────────────────────────
function DonutLabel({ cx, cy, total }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-6" fontSize="22" fontWeight="800" fill="var(--text)">{total}</tspan>
      <tspan x={cx} dy="20" fontSize="11" fill="var(--text3)">total</tspan>
    </text>
  );
}

// Theme-consistent chart colors
const CHART_COLORS = ['var(--accent)', 'var(--green)', 'var(--orange)', 'var(--purple)', 'var(--blue)', 'var(--red)'];
const PERIODS = ['7d','14d','30d'];

export default function DashboardPage() {
  const { user }           = useAuth();
  const { stats, loading } = useDashboard();
  const [activePeriod, setActivePeriod] = useState('30d');

  // Process stock trend data
  const rawTrend = stats?.stock_trend || [];
  const allTrend = rawTrend.map(row => ({
    date: row.date?.slice(5) || row.date,
    qty:  parseInt(row.total_quantity || 0),
  }));

  // Filter by period
  const periodDays = { '7d': 7, '14d': 14, '30d': 30 };
  const stockTrend = allTrend.slice(-periodDays[activePeriod]);

  // Fill gaps — make chart smooth even with sparse data
  // If only 1 data point, duplicate it so recharts renders
  const chartData = stockTrend.length === 1
    ? [stockTrend[0], stockTrend[0]]
    : stockTrend;

  // Category donut data
  const categoryData = (stats?.category_breakdown || [])
    .filter(r => parseInt(r.total_quantity) > 0)
    .map(row => ({ name: row.name, value: parseInt(row.total_quantity || 0) }));

  const totalUnits = categoryData.reduce((s, d) => s + d.value, 0);
  const hasStock   = chartData.length >= 2;
  const hasCat     = categoryData.length > 0;

  // Peak value for chart label
  const peakQty = chartData.length ? Math.max(...chartData.map(d => d.qty)) : 0;

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Dashboard — StockWise</title></Head>

        {/* Header */}
        <div className="flex items-start justify-between mb-5 gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
              Hi, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text2)' }}>
              Here's your inventory overview
            </p>
          </div>
          <Link href="/inventory" className="btn-primary flex-shrink-0">
            <Plus size={15} /> Add Item
          </Link>
        </div>

        {/* Stats */}
        <StatsGrid stats={stats} loading={loading} />

        {/* ── CHARTS ROW ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">

          {/* ── Stock Trend Chart (2/3 width) ── */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}>
            <div className="p-5 pb-0">
              {/* Header row */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Stock Activity</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>
                    Units added to inventory
                  </p>
                </div>
                {/* Period selector */}
                <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--surface2)' }}>
                  {PERIODS.map(p => (
                    <button key={p} onClick={() => setActivePeriod(p)}
                      className="px-3 py-1 rounded-lg text-xs font-bold transition-all duration-150"
                      style={{
                        background: activePeriod === p ? 'var(--accent)' : 'transparent',
                        color: activePeriod === p ? 'white' : 'var(--text2)',
                        border: activePeriod === p ? '1px solid var(--accent)' : '1px solid transparent',
                      }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Peak label */}
              {hasStock && peakQty > 0 && (
                <div className="mb-2">
                  <span className="text-2xl font-black" style={{ color: 'var(--text)' }}>{peakQty}</span>
                  <span className="text-sm ml-2" style={{ color: 'var(--text2)' }}>
                    peak units
                  </span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-52">
                <Spinner />
              </div>
            ) : hasStock ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    {/* Theme-consistent gradient */}
                    <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="var(--accent)" stopOpacity={0.6} />
                      <stop offset="50%"  stopColor="var(--accent2)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.05} />
                    </linearGradient>
                    {/* Glow filter on line */}
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'var(--text3)', fontSize: 10 }}
                    axisLine={false} tickLine={false}
                    tickFormatter={d => d?.replace('-','/')}
                  />
                  <YAxis
                    tick={{ fill: 'var(--text3)', fontSize: 10 }}
                    axisLine={false} tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<StockTooltip />}
                    cursor={{
                      stroke: 'var(--accent)',
                      strokeWidth: 1,
                      strokeDasharray: '4 4',
                    }}
                  />
                  <Area
                    type="monotoneX"
                    dataKey="qty"
                    name="Units"
                    stroke="var(--accent)"
                    strokeWidth={3}
                    fill="url(#stockGradient)"
                    filter="url(#glow)"
                    dot={false}
                    activeDot={{
                      r: 6,
                      fill: 'var(--text)',
                      stroke: 'var(--accent)',
                      strokeWidth: 2,
                      filter: 'url(#glow)',
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-52"
                style={{ color: 'var(--text3)' }}>
                <Package size={32} className="mb-2 opacity-30" />
                <p className="text-sm">No stock activity yet.</p>
                <Link href="/inventory" className="text-xs mt-2 font-semibold"
                  style={{ color: 'var(--accent)' }}>
                  Add your first item →
                </Link>
              </div>
            )}
          </div>

          {/* ── Category Donut (1/3 width) ── */}
          <div className="rounded-2xl p-5"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>By Category</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text2)' }}>
              Stock distribution
            </p>

            {loading ? (
              <div className="flex items-center justify-center h-44"><Spinner /></div>
            ) : hasCat ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <DonutLabel cx="50%" cy="50%" total={totalUnits} />
                    <Tooltip
                      formatter={(val, name) => [`${val} units`, name]}
                      contentStyle={{
                        background: 'rgba(15,23,42,0.95)',
                        border: '1px solid rgba(99,150,255,0.2)',
                        borderRadius: '10px',
                        fontSize: '12px',
                        color: '#fff',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="space-y-2 mt-3">
                  {categoryData.map((d, i) => {
                    const pct = totalUnits > 0 ? ((d.value / totalUnits) * 100).toFixed(0) : 0;
                    return (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-xs truncate" style={{ color: 'rgba(203,213,225,0.8)' }}>
                            {d.name}
                          </span>
                        </div>
                        <span className="text-xs font-bold flex-shrink-0 ml-2"
                          style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-44"
                style={{ color: 'var(--text3)' }}>
                <p className="text-sm">No categories yet.</p>
              </div>
            )}
          </div>
        </div>
        {/* Period selector */}
        <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--surface2)' }}>
          {PERIODS.map(p => (
            <button key={p} onClick={() => setActivePeriod(p)}
              className="px-3 py-1 rounded-lg text-xs font-bold transition-all duration-150"
              style={{
                background: activePeriod === p ? 'var(--accent)' : 'transparent',
                color: activePeriod === p ? 'white' : 'var(--text2)',
                border: activePeriod === p ? '1px solid var(--accent)' : '1px solid transparent',
              }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}15` }}
              >
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{label}</p>
                <p className="text-xs" style={{ color: 'var(--text2)' }}>{sub}</p>
              </div>
              <ArrowRight size={15} style={{ color, flexShrink: 0 }} />
            </button>
          ))}
        </div>

        {/* Low stock */}
        <div className="mt-4">
          <LowStockTable items={stats?.low_stock_items ?? []} />
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
