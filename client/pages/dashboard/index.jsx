import Head from 'next/head';
import Link from 'next/link';
import { Plus, Package, TrendingUp, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import StatsGrid from '../../components/dashboard/StatsGrid';
import LowStockTable from '../../components/dashboard/LowStockTable';
import { useDashboard } from '../../hooks/useDashboard';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../../components/ui/Spinner';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

const BAR_COLORS = ['#6366f1','#8b5cf6','#a855f7','#c084fc','#d8b4fe','#818cf8'];

export default function DashboardPage() {
  const { user }            = useAuth();
  const { stats, loading }  = useDashboard();

  // Real data from API — no more mock data
  const stockTrend = (stats?.stock_trend || []).map(row => ({
    date:  row.date?.slice(5) || row.date, // show MM-DD
    items: parseInt(row.items_added || 0),
    qty:   parseInt(row.total_quantity || 0),
  }));

  const categoryData = (stats?.category_breakdown || []).map(row => ({
    name:  row.name,
    value: parseInt(row.total_quantity || 0),
  }));

  const hasStockData    = stockTrend.length > 0;
  const hasCategoryData = categoryData.filter(d => d.value > 0).length > 0;

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Dashboard — StockWise</title></Head>

        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
              Hi, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text2)' }}>
              Here's your inventory at a glance
            </p>
          </div>
          <Link href="/inventory" className="btn-primary flex-shrink-0">
            <Plus size={15} /> Add Item
          </Link>
        </div>

        {/* Stats grid */}
        <StatsGrid stats={stats} loading={loading} />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">

          {/* Stock trend — real data */}
          <div className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  Stock Activity — Last 30 Days
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>
                  Items added to inventory
                </p>
              </div>
              {hasStockData && (
                <span className="badge badge-green flex items-center gap-1">
                  <TrendingUp size={10} /> Active
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48"><Spinner /></div>
            ) : hasStockData ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stockTrend} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--surface3)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text3)', fontSize: 10 }}
                    axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }}
                    axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="qty" name="Units"
                    stroke="#6366f1" strokeWidth={2.5} fill="url(#stockGrad)"
                    dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-48"
                style={{ color: 'var(--text3)' }}>
                <Package size={32} className="mb-2 opacity-30" />
                <p className="text-sm">No inventory activity yet.</p>
                <Link href="/inventory" className="text-xs mt-2 font-medium"
                  style={{ color: 'var(--accent3)' }}>
                  Add your first item →
                </Link>
              </div>
            )}
          </div>

          {/* Category breakdown — real data */}
          <div className="card p-5">
            <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>
              By Category
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text2)' }}>
              Stock distribution
            </p>
            {loading ? (
              <div className="flex items-center justify-center h-48"><Spinner /></div>
            ) : hasCategoryData ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-48"
                style={{ color: 'var(--text3)' }}>
                <p className="text-sm">No categories yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {[
            { href: '/inventory', label: 'Manage Inventory', sub: 'Add, edit, remove items', color: 'var(--accent)' },
            { href: '/sales',     label: 'View Sales',       sub: 'Revenue & top items',     color: 'var(--green)' },
          ].map(({ href, label, sub, color }) => (
            <Link key={href} href={href}
              className="card p-4 flex items-center justify-between transition-all duration-200 group"
              style={{ ':hover': { borderColor: color } }}
              onMouseEnter={e => e.currentTarget.style.borderColor = color}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>{sub}</p>
              </div>
              <ArrowRight size={16} style={{ color }} />
            </Link>
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
