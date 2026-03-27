import Head from 'next/head';
import Link from 'next/link';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
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

const COLORS = ['#0ea5e9','#8b5cf6','#22c55e','#f59e0b'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
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

  const axisColor  = isDark ? '#475569' : '#cbd5e1';
  const gridColor  = isDark ? '#1e293b' : '#f1f5f9';
  const textColor  = isDark ? '#94a3b8' : '#64748b';

  // Mock trend data (replace with real API data in Sprint 2)
  const stockTrend = [
    { month: 'Oct', value: 240 },
    { month: 'Nov', value: 290 },
    { month: 'Dec', value: 180 },
    { month: 'Jan', value: 320 },
    { month: 'Feb', value: 270 },
    { month: 'Mar', value: stats?.total_quantity ?? 300 },
  ];

  const categoryData = [
    { name: 'Electronics', value: 35 },
    { name: 'Clothing',    value: 25 },
    { name: 'Food',        value: 20 },
    { name: 'Others',      value: 20 },
  ];

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Dashboard — StockWise</title></Head>

        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Good day, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Here's your inventory overview
            </p>
          </div>
          <Link href="/inventory" className="btn-primary flex-shrink-0">
            <Plus size={16} /> Add Item
          </Link>
        </div>

        {/* Stats */}
        <StatsGrid stats={stats} loading={loading} />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
          {/* Stock trend — 2/3 width */}
          <div className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Stock Level Trend</h3>
                <p className="text-xs text-slate-400 mt-0.5">Total units over last 6 months</p>
              </div>
              <span className="badge-green flex items-center gap-1">
                <TrendingUp size={11} /> +12%
              </span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-48"><Spinner /></div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stockTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: axisColor }} />
                  <YAxis tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: axisColor }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" name="Units"
                    stroke="#0ea5e9" strokeWidth={2} fill="url(#grad)" dot={{ fill: '#0ea5e9', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category breakdown — 1/3 width */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 dark:text-white text-sm mb-1">By Category</h3>
            <p className="text-xs text-slate-400 mb-4">Stock distribution</p>
            {loading ? (
              <div className="flex items-center justify-center h-48"><Spinner /></div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                    paddingAngle={4} dataKey="value">
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Legend iconType="circle" iconSize={8}
                    formatter={(v) => <span style={{ fontSize: 11, color: textColor }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Low stock */}
        <div className="mt-6">
          <LowStockTable items={stats?.low_stock_items ?? []} />
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
