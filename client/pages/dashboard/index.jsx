import Head from 'next/head';
import Link from 'next/link';
import { Plus, TrendingUp, ArrowRight } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import StatsGrid from '../../components/dashboard/StatsGrid';
import LowStockTable from '../../components/dashboard/LowStockTable';
import { useDashboard } from '../../hooks/useDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Spinner from '../../components/ui/Spinner';

const PIE_COLORS = ['#007aff','#af52de','#34c759','#ff9500'];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-ios-md">
      <p className="font-semibold mb-1" style={{ color: 'var(--ios-text)' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user }          = useAuth();
  const { isDark }        = useTheme();
  const { stats, loading } = useDashboard();

  const axisColor = isDark ? '#27272a' : '#f4f4f5';
  const tickColor = isDark ? '#71717a' : '#a1a1aa';

  const stockTrend = [
    { month: 'Oct', value: 240 }, { month: 'Nov', value: 290 },
    { month: 'Dec', value: 180 }, { month: 'Jan', value: 320 },
    { month: 'Feb', value: 270 }, { month: 'Mar', value: stats?.total_quantity ?? 300 },
  ];

  const catData = [
    { name: 'Electronics', value: 35 }, { name: 'Clothing', value: 25 },
    { name: 'Food', value: 20 },        { name: 'Others', value: 20 },
  ];

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Dashboard — StockWise</title></Head>

        {/* Header */}
        <div className="flex items-start justify-between mb-5 gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--ios-text)' }}>
              Hi, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--ios-text2)' }}>
              Here's your inventory overview
            </p>
          </div>
          <Link href="/inventory" className="btn-primary">
            <Plus size={16} /> Add Item
          </Link>
        </div>

        {/* Stats */}
        <StatsGrid stats={stats} loading={loading} />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          {/* Area chart */}
          <div className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--ios-text)' }}>Stock Trend</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--ios-text2)' }}>Last 6 months</p>
              </div>
              <span className="badge badge-green flex items-center gap-1">
                <TrendingUp size={10} /> +12%
              </span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-48"><Spinner /></div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stockTrend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#007aff" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#007aff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={axisColor} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="value" name="Units"
                    stroke="#007aff" strokeWidth={2.5} fill="url(#stockGrad)"
                    dot={{ fill: '#007aff', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie chart */}
          <div className="card p-5">
            <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--ios-text)' }}>By Category</h3>
            <p className="text-xs mb-3" style={{ color: 'var(--ios-text2)' }}>Distribution</p>
            {loading ? (
              <div className="flex items-center justify-center h-48"><Spinner /></div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={catData} cx="50%" cy="45%" innerRadius={48} outerRadius={72}
                    paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => `${v}%`} />
                  <Legend iconType="circle" iconSize={7}
                    formatter={v => <span style={{ fontSize: 11, color: tickColor }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Link href="/inventory" className="card p-4 flex items-center justify-between group transition-all duration-150"
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ios-blue)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--ios-border)'}>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--ios-text)' }}>Manage Inventory</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ios-text2)' }}>Add, edit, remove items</p>
            </div>
            <ArrowRight size={16} style={{ color: 'var(--ios-blue)' }} />
          </Link>
          <Link href="/sales" className="card p-4 flex items-center justify-between transition-all duration-150"
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ios-green)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--ios-border)'}>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--ios-text)' }}>View Sales</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ios-text2)' }}>Revenue & top items</p>
            </div>
            <ArrowRight size={16} style={{ color: 'var(--ios-green)' }} />
          </Link>
        </div>

        {/* Low stock */}
        <div className="mt-4">
          <LowStockTable items={stats?.low_stock_items ?? []} />
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
