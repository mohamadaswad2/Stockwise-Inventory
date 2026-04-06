import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { Plus, TrendingUp, ArrowRight, Package, ShoppingCart } from 'lucide-react';
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
import Spinner from '../../components/ui/Spinner';

// Custom tooltip — clean dark card
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-lg"
      style={{ border: '1px solid var(--border2)' }}>
      <p className="font-bold mb-1" style={{ color: 'var(--text)' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

// No DonutCentreLabel component needed — use absolute div overlay instead

const DONUT_COLORS = ['#6366f1','#8b5cf6','#a855f7','#c084fc','#3b82f6','#60a5fa'];
const PERIODS = [
  { key: '7d',  label: '7D' },
  { key: '14d', label: '14D' },
  { key: '30d', label: '30D' },
];

export default function DashboardPage() {
  const { user }           = useAuth();
  const { stats, loading } = useDashboard();
  const [activePeriod, setActivePeriod] = useState('30d');

  const rawTrend = stats?.stock_trend || [];

  // Backend returns 30 days always — map fields, ensure numbers
  const allTrend = rawTrend.map(row => ({
    date:    row.date?.slice(5) || String(row.date || '').slice(5),
    qty:     Math.max(0, parseInt(row.qty     || row.qty_in  || 0)),
    qty_out: Math.max(0, parseInt(row.qty_out || 0)),
  }));

  // Slice by period — 30d = all 30 rows, 7d = last 7, 14d = last 14
  const periodDays = { '7d': 7, '14d': 14, '30d': 30 };
  const chartData  = allTrend.slice(-periodDays[activePeriod]);

  // Category data — max 5, only non-zero
  const categoryData = (stats?.category_breakdown || [])
    .filter(r => parseInt(r.total_quantity) > 0)
    .slice(0, 5)
    .map(row => ({ name: row.name, value: parseInt(row.total_quantity || 0) }));

  const totalUnits = categoryData.reduce((s, d) => s + d.value, 0);

  // hasStock = true if we have data rows AND at least one non-zero value
  const hasActivity = chartData.some(d => d.qty > 0 || d.qty_out > 0);
  const hasStock    = chartData.length >= 2 && hasActivity;
  const hasCat      = categoryData.length > 0;

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

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">

          {/* Stock Trend — 2/3 */}
          <div className="lg:col-span-2 card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  Stock Activity
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>
                  Stock added per day
                </p>
              </div>
              {/* Period selector */}
              <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--surface2)' }}>
                {PERIODS.map(({ key, label }) => (
                  <button key={key} onClick={() => setActivePeriod(key)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150"
                    style={{
                      background: activePeriod === key
                        ? 'linear-gradient(135deg,var(--accent),var(--accent2))'
                        : 'transparent',
                      color: activePeriod === key ? '#fff' : 'var(--text2)',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-52"><Spinner /></div>
            ) : hasStock ? (
              <ResponsiveContainer width="100%" height={220} key={activePeriod}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--surface3)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'var(--text3)', fontSize: 10 }}
                    axisLine={false} tickLine={false} tickMargin={8}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: 'var(--text3)', fontSize: 10 }}
                    axisLine={false} tickLine={false}
                    allowDecimals={false}
                    width={40} tickMargin={4}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ stroke: 'var(--border2)', strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="qty"
                    name="Units"
                    stroke="#6366f1"
                    strokeWidth={1.5}
                    fill="url(#dashGrad)"
                    dot={false}
                    activeDot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-52"
                style={{ color: 'var(--text3)' }}>
                <Package size={32} className="mb-2 opacity-30" />
                <p className="text-sm font-medium" style={{ color: 'var(--text2)' }}>
                  No stock activity in this period
                </p>
                <p className="text-xs mt-1 text-center px-4" style={{ color: 'var(--text3)' }}>
                  Chart updates when you add items or restock
                </p>
                <Link href="/inventory" className="text-xs mt-3 font-semibold"
                  style={{ color: 'var(--accent3)' }}>
                  Go to Inventory →
                </Link>
              </div>
            )}
          </div>

          {/* Category Donut — 1/3 */}
          <div className="card p-5">
            <h3 className="text-sm font-bold mb-0.5" style={{ color: 'var(--text)' }}>
              By Category
            </h3>
            <p className="text-xs mb-3" style={{ color: 'var(--text2)' }}>
              Stock distribution
            </p>

            {loading ? (
              <div className="flex items-center justify-center h-44"><Spinner /></div>
            ) : hasCat ? (
              <>
                {/* Donut chart with absolute overlay for centre label */}
                <div style={{ position: 'relative', height: '150px' }}>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Pie
                        data={categoryData}
                        cx="50%" cy="50%"
                        innerRadius={44} outerRadius={66}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                        isAnimationActive={false}>
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v, n) => [`${v} units`, n]}
                        contentStyle={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border2)',
                          borderRadius: '10px',
                          fontSize: '11px',
                          color: 'var(--text)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Centre label — absolute overlay, zero crash risk */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center', pointerEvents: 'none',
                  }}>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
                      {totalUnits}
                    </p>
                    <p style={{ margin: 0, fontSize: '10px', color: 'var(--text3)', marginTop: '3px' }}>
                      units
                    </p>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-1.5 mt-3">
                  {categoryData.map((d, i) => {
                    const pct = totalUnits > 0 ? ((d.value / totalUnits) * 100).toFixed(0) : 0;
                    return (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                          <span className="text-xs truncate" style={{ color: 'var(--text2)' }}>
                            {d.name}
                          </span>
                        </div>
                        <span className="text-xs font-bold flex-shrink-0 ml-2"
                          style={{ color: DONUT_COLORS[i % DONUT_COLORS.length] }}>
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

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {[
            { href: '/inventory', label: 'Manage Inventory', sub: 'Add, edit, remove items', color: 'var(--accent)',  icon: Package },
            { href: '/sales',     label: 'View Sales',       sub: 'Revenue & analytics',      color: 'var(--green)', icon: ShoppingCart },
          ].map(({ href, label, sub, color, icon: Icon }) => (
            <Link key={href} href={href}
              className="card p-4 flex items-center justify-between transition-all duration-200"
              onMouseEnter={e => { e.currentTarget.style.borderColor = color; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}18` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{label}</p>
                  <p className="text-xs" style={{ color: 'var(--text2)' }}>{sub}</p>
                </div>
              </div>
              <ArrowRight size={15} style={{ color, flexShrink: 0 }} />
            </Link>
          ))}
        </div>

        {/* Low stock table */}
        <div className="mt-4">
          <LowStockTable items={stats?.low_stock_items ?? []} />
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
