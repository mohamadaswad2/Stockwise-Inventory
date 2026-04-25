import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { Plus, ArrowRight, Package, ShoppingCart } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import StatsGrid from '../../components/dashboard/StatsGrid';
import LowStockTable from '../../components/dashboard/LowStockTable';
import PremiumAreaChart, { ChartSkeleton } from '../../components/charts/PremiumAreaChart';
import { useDashboard } from '../../hooks/useDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { getAnalytics } from '../../services/transaction.service';
import { useCurrency } from '../../contexts/CurrencyContext';

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: '7d',    label: '7 Days' },
  { key: '30d',   label: '30 Days' },
];

// Map dashboard period key → backend analytics period key
const BACKEND_PERIOD = { today: 'today', '7d': '7d', '30d': '1m' };

// Revenue chart series — priority order: revenue first (thicker), qty_added dashed on right
const REVENUE_SERIES = [
  { key: 'revenue', name: 'Revenue', color: 'var(--green)' },
];
const QTY_AXIS = { key: 'qty_added', name: 'Stock In', color: 'var(--accent3)' };

// Donut colours — brand palette, works in light + dark mode
const DONUT_COLORS = ['#7b7bf8','#a78bfa','#c084fc','#818cf8','#60a5fa','#93c5fd'];

export default function DashboardPage() {
  const { user }                 = useAuth();
  const { stats, loading }       = useDashboard();
  const { format, formatFull }   = useCurrency();
  const [activePeriod, setActive]  = useState('today');
  const [chartData,    setChartData]  = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartVisible, setChartVisible] = useState(true);

  // Fade-transition chart on period change
  const loadChart = useCallback(async (period) => {
    setChartVisible(false);
    setChartLoading(true);
    await new Promise(r => setTimeout(r, 120));
    try {
      const res = await getAnalytics(BACKEND_PERIOD[period]);
      setChartData(res.data.data?.trend || []);
    } catch { setChartData([]); }
    finally { setChartLoading(false); setChartVisible(true); }
  }, []);

  useEffect(() => { loadChart(activePeriod); }, [activePeriod, loadChart]);

  // Category donut data
  const categoryData = (stats?.category_breakdown || [])
    .filter(r => parseInt(r.total_quantity) > 0)
    .slice(0, 5)
    .map(row => ({ name: row.name, value: parseInt(row.total_quantity || 0) }));
  const totalUnits = categoryData.reduce((s, d) => s + d.value, 0);

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Dashboard — StockWise</title></Head>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, gap:12 }}>
          <div>
            <h1 style={{ fontSize:18, fontWeight:800, color:'var(--text)', letterSpacing:'-0.4px' }}>
              Hi, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p style={{ fontSize:13, color:'var(--text3)', marginTop:2 }}>
              Here's your inventory overview
            </p>
          </div>
          <Link href="/inventory" className="btn-primary" style={{ height:36, paddingLeft:14, paddingRight:14, fontSize:13, flexShrink:0 }}>
            <Plus size={15}/> Add Item
          </Link>
        </div>

        {/* ── Stats ────────────────────────────────────────────────────── */}
        <StatsGrid stats={stats} loading={loading} />

        {/* ── Charts row ───────────────────────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:12, marginTop:14 }}
          className="lg:grid-cols-3">

          {/* Stock Activity — spans 2 cols on desktop */}
          <div className="card lg:col-span-2" style={{ padding:20 }}>

            {/* Chart header */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16, gap:12 }}>
              <div>
                <p style={{ fontWeight:700, fontSize:14, color:'var(--text)', letterSpacing:'-0.2px' }}>
                  Stock Activity
                </p>
                <p style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>
                  {activePeriod === 'today' ? 'Revenue by hour · today' : `Revenue & stock added · last ${activePeriod === '7d' ? '7' : '30'} days`}
                </p>
              </div>

              {/* Period pill selector */}
              <div style={{ display:'flex', gap:2, padding:3, background:'var(--surface2)', borderRadius:10, border:'1px solid var(--border)', flexShrink:0 }}>
                {PERIODS.map(({ key, label }) => (
                  <button key={key}
                    onClick={() => key !== activePeriod && setActive(key)}
                    style={{
                      padding:'5px 12px', borderRadius:8, fontSize:12, fontWeight:600, border:'none',
                      background: activePeriod === key ? 'var(--accent)' : 'transparent',
                      color:      activePeriod === key ? '#fff'          : 'var(--text3)',
                      cursor:'pointer', transition:'all 180ms ease',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart body — fade transition on period switch */}
            <div style={{ opacity: chartVisible ? 1 : 0, transition:'opacity 180ms ease' }}>
              {chartLoading
                ? <ChartSkeleton height={210} />
                : <PremiumAreaChart
                    data={chartData}
                    series={REVENUE_SERIES}
                    rightAxis={QTY_AXIS}
                    formatY={v => format(v, 0)}
                    height={210}
                    chartKey={`dash-${activePeriod}`}
                    showLegend={true}
                  />
              }
            </div>
          </div>

          {/* Category Donut */}
          <div className="card" style={{ padding:20 }}>
            <p style={{ fontWeight:700, fontSize:14, color:'var(--text)', marginBottom:2 }}>By Category</p>
            <p style={{ fontSize:12, color:'var(--text3)', marginBottom:14 }}>Stock distribution</p>

            {loading ? (
              <ChartSkeleton height={160} />
            ) : categoryData.length > 0 ? (
              <>
                <div style={{ position:'relative', height:150 }}>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart margin={{ top:0, right:0, bottom:0, left:0 }}>
                      <Pie
                        data={categoryData} cx="50%" cy="50%"
                        innerRadius={42} outerRadius={64}
                        paddingAngle={3} dataKey="value"
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
                        contentStyle={{ background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:10, fontSize:11, color:'var(--text)', boxShadow:'var(--shadow-md)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Centre label */}
                  <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', pointerEvents:'none' }}>
                    <p style={{ fontSize:18, fontWeight:800, color:'var(--text)', lineHeight:1 }}>{totalUnits}</p>
                    <p style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>units</p>
                  </div>
                </div>

                {/* Category legend */}
                <div style={{ display:'flex', flexDirection:'column', gap:7, marginTop:14 }}>
                  {categoryData.map((d, i) => {
                    const pct = totalUnits > 0 ? ((d.value / totalUnits) * 100).toFixed(0) : 0;
                    return (
                      <div key={d.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:7, minWidth:0, flex:1 }}>
                          <div style={{ width:7, height:7, borderRadius:'50%', background:DONUT_COLORS[i % DONUT_COLORS.length], flexShrink:0 }} />
                          <span style={{ fontSize:12, color:'var(--text2)' }} className="truncate">{d.name}</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                          <div style={{ width:48, height:4, borderRadius:99, background:'var(--surface2)', overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${pct}%`, background:DONUT_COLORS[i % DONUT_COLORS.length], borderRadius:99, transition:'width 600ms ease' }} />
                          </div>
                          <span style={{ fontSize:11, fontWeight:700, color:DONUT_COLORS[i % DONUT_COLORS.length], minWidth:26, textAlign:'right' }}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ height:150, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <p style={{ fontSize:13, color:'var(--text3)' }}>No categories yet</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Quick actions ─────────────────────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:14 }}>
          {[
            { href:'/inventory', label:'Manage Inventory', sub:'Add, edit, restock items',    color:'var(--accent3)', bg:'var(--accent-bg)', icon:Package },
            { href:'/sales',     label:'View Sales',       sub:'Revenue & transaction log',   color:'var(--green)',   bg:'var(--green-bg)', icon:ShoppingCart },
          ].map(({ href, label, sub, color, bg, icon:Icon }) => (
            <Link key={href} href={href}
              className="card"
              style={{ padding:16, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, textDecoration:'none', transition:'all 150ms ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={17} style={{ color }} />
                </div>
                <div>
                  <p style={{ fontWeight:700, fontSize:14, color:'var(--text)' }}>{label}</p>
                  <p style={{ fontSize:12, color:'var(--text3)' }}>{sub}</p>
                </div>
              </div>
              <ArrowRight size={15} style={{ color, flexShrink:0 }} />
            </Link>
          ))}
        </div>

        {/* ── Low stock ─────────────────────────────────────────────────── */}
        <div style={{ marginTop:14 }}>
          <LowStockTable items={stats?.low_stock_items ?? []} loading={loading} />
        </div>

      </AppLayout>
    </ProtectedRoute>
  );
}
