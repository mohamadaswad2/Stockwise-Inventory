import Head from 'next/head';
import Link from 'next/link';
import { Plus, Package, TrendingUp, Users, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, AreaChart, Area, CartesianGrid, XAxis, YAxis } from 'recharts';
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

const BAR_COLORS = [
  'var(--accent)', 
  'var(--green)', 
  'var(--blue)', 
  'var(--orange)', 
  'var(--purple)', 
  'var(--pink)'
];

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

  // Custom label untuk donut chart - label luar dengan garis putus-putus
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30; // Position label outside donut
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Line dari donut ke label
    const lineStartX = cx + (outerRadius + 5) * Math.cos(-midAngle * RADIAN);
    const lineStartY = cy + (outerRadius + 5) * Math.sin(-midAngle * RADIAN);
    const lineEndX = cx + (outerRadius + 25) * Math.cos(-midAngle * RADIAN);
    const lineEndY = cy + (outerRadius + 25) * Math.sin(-midAngle * RADIAN);

    return (
      <g>
        {/* Dotted line */}
        <line
          x1={lineStartX}
          y1={lineStartY}
          x2={lineEndX}
          y2={lineEndY}
          stroke={BAR_COLORS[index % BAR_COLORS.length]}
          strokeWidth={1}
          strokeDasharray="2 2"
          opacity={0.6}
        />
        {/* Label background */}
        <rect
          x={x - 20}
          y={y - 10}
          width={40}
          height={20}
          rx={4}
          fill="white"
          stroke={BAR_COLORS[index % BAR_COLORS.length]}
          strokeWidth={1}
          opacity={0.9}
        />
        {/* Label text */}
        <text 
          x={x} 
          y={y} 
          fill={BAR_COLORS[index % BAR_COLORS.length]}
          textAnchor="middle" 
          dominantBaseline="central"
          className="text-xs font-bold"
        >
          {categoryData[index]?.value || 0}
        </text>
      </g>
    );
  };

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
          <div className="card p-6 relative overflow-hidden bg-gradient-to-br from-surface to-surface2 border-0 shadow-2xl">
            {/* Premium background effects */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-accent/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue/20 via-transparent to-transparent rounded-full blur-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>
                    Category Distribution
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text2)' }}>
                    Real-time inventory breakdown
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-medium" style={{ color: 'var(--green)' }}>
                    Live
                  </span>
                </div>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center h-52">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-accent/20 border-t-accent animate-spin"></div>
                  </div>
                </div>
              ) : hasCategoryData ? (
                <div className="relative">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <defs>
                        {BAR_COLORS.map((color, index) => (
                          <linearGradient key={index} id={`premium-gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={color} stopOpacity={1} />
                            <stop offset="50%" stopColor={color} stopOpacity={0.8} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                          </linearGradient>
                        ))}
                        {/* Premium shadow filter */}
                        <filter id="premium-shadow" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                          <feOffset dx="0" dy="2" result="offsetblur"/>
                          <feFlood floodColor="#000000" floodOpacity="0.2"/>
                          <feComposite in2="offsetblur" operator="in"/>
                          <feMerge>
                            <feMergeNode/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={8} // Jarak antara segmen
                        cornerRadius={12} // Sudut bulat untuk segmen
                        dataKey="value"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        animationBegin={0}
                        animationDuration={2000}
                        animationEasing="cubic-bezier(0.4, 0, 0.2, 1)"
                        isAnimationActive={true}
                      >
                        {categoryData.map((_, i) => (
                          <Cell 
                            key={i} 
                            fill={`url(#premium-gradient-${i})`}
                            filter="url(#premium-shadow)"
                            className="transition-all duration-500"
                            style={{
                              cursor: 'default',
                              outline: 'none'
                            }}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const total = categoryData.reduce((sum, item) => sum + item.value, 0);
                            const percentage = ((payload[0].value / total) * 100).toFixed(1);
                            return (
                              <div className="card px-4 py-3 shadow-2xl border-0 bg-surface/95 backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-2">
                                  <div 
                                    className="w-3 h-3 rounded-full shadow-sm"
                                    style={{ backgroundColor: BAR_COLORS[payload[0].index % BAR_COLORS.length] }}
                                  />
                                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                                    {payload[0].name}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs" style={{ color: 'var(--text2)' }}>
                                    <span className="font-bold text-lg" style={{ color: 'var(--text)' }}>{payload[0].value}</span> units
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1 bg-surface3 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ 
                                          width: `${percentage}%`,
                                          backgroundColor: BAR_COLORS[payload[0].index % BAR_COLORS.length]
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs font-bold" style={{ color: BAR_COLORS[payload[0].index % BAR_COLORS.length] }}>
                                      {percentage}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                        cursorStyle="default"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Center text - ganti dengan icon atau gambar */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-surface to-surface2 flex items-center justify-center shadow-inner">
                        <Package size={28} style={{ color: 'var(--accent)' }} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-52">
                  <div className="w-16 h-16 rounded-full bg-surface3 flex items-center justify-center mb-3">
                    <Package size={24} style={{ color: 'var(--text3)' }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text3)' }}>
                    No categories yet
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>
                    Start adding items to see distribution
                  </p>
                </div>
              )}
              
              {/* Premium legend */}
              {hasCategoryData && (
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {categoryData.slice(0, 4).map((item, index) => {
                    const percentage = ((item.value / categoryData.reduce((sum, cat) => sum + cat.value, 0)) * 100).toFixed(1);
                    return (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-surface/50 backdrop-blur-sm border border-surface3/50">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full shadow-sm animate-pulse"
                            style={{ backgroundColor: BAR_COLORS[index % BAR_COLORS.length] }}
                          />
                          <div>
                            <p className="text-xs font-medium truncate max-w-20" style={{ color: 'var(--text)' }}>
                              {item.name}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text3)' }}>
                              {percentage}%
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                          {item.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
