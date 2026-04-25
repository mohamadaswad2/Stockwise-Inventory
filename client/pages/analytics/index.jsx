import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  TrendingUp, DollarSign, ShoppingBag, BarChart2,
  Lock, Download, Package, HelpCircle,
} from 'lucide-react';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { safeNumber } from '../../utils/safeNumber';
import { getAnalytics } from '../../services/transaction.service';
import RevenueExplainer from '../../components/analytics/RevenueExplainer';
import TransactionTypeLegend from '../../components/analytics/TransactionTypeLegend';
import PremiumAreaChart from '../../components/charts/PremiumAreaChart';
import toast from 'react-hot-toast';
import { getTooltip } from '../../config/tooltips.config';

/* ── Plan gate ───────────────────────────────────────────────────────────────── */
const ADVANCED_PLANS = ['premium', 'deluxe'];

/* ── Periods — today / 7d / 3m only ─────────────────────────────────────────── */
const PERIODS = [
  { key: 'today', label: 'Today',    advanced: false },
  { key: '7d',    label: '7 Days',   advanced: false },
  { key: '3m',    label: '3 Months', advanced: true  },
];

/* ── Metric card ─────────────────────────────────────────────────────────────── */
function MetricCard({ icon: Icon, label, value, sub, color, tooltip }) {
  const [showTip, setShowTip] = useState(false);
  const palette = {
    green:  { bg: 'var(--green-bg)',  c: 'var(--green)'   },
    blue:   { bg: 'var(--accent-bg)', c: 'var(--accent3)' },
    orange: { bg: 'var(--orange-bg)', c: 'var(--orange)'  },
    purple: { bg: 'var(--purple-bg)', c: 'var(--purple)'  },
  };
  const p = palette[color] || palette.blue;

  return (
    <div className="card" style={{ padding:14 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:p.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon size={16} style={{ color: p.c }} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
            <p style={{ fontSize:10, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
              {label}
            </p>
            {tooltip && (
              <div style={{ position:'relative' }}
                onMouseEnter={() => setShowTip(true)}
                onMouseLeave={() => setShowTip(false)}>
                <HelpCircle size={11} style={{ color:'var(--text3)', opacity:0.6, cursor:'help' }} />
                {showTip && <div className="tooltip-content">{tooltip}</div>}
              </div>
            )}
          </div>
          <p style={{ fontSize:18, fontWeight:800, color:'var(--text)', letterSpacing:'-0.4px', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>
            {value}
          </p>
          {sub && <p style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{sub}</p>}
        </div>
      </div>
    </div>
  );
}

/* ── Mobile item row — all columns ──────────────────────────────────────────── */
function MobileItemRow({ item, idx, formatFull }) {
  const profit    = Number(item.profit);
  const cost      = Number(item.total_cost);
  const revenue   = Number(item.revenue);
  const isProfit  = profit >= 0;
  const margin    = Number(item.margin_pct);
  const rankColors = ['var(--orange)','var(--text3)','var(--orange)'];
  const rankColor  = idx < 3 ? rankColors[idx] : 'var(--text3)';

  return (
    <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)' }}>
      {/* Row 1: rank + name + margin */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
        <div style={{ width:24, height:24, borderRadius:6, flexShrink:0, background:'var(--surface2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:rankColor }}>
          {idx + 1}
        </div>
        <p style={{ fontWeight:600, fontSize:13, color:'var(--text)', flex:1, minWidth:0 }} className="truncate">
          {item.name}
          {item.sku && <span style={{ fontSize:10, color:'var(--text3)', marginLeft:6, fontFamily:'monospace' }}>{item.sku}</span>}
        </p>
        <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99, flexShrink:0, background: margin >= 30 ? 'var(--green-bg)' : margin >= 10 ? 'var(--orange-bg)' : 'var(--red-bg)', color: margin >= 30 ? 'var(--green)' : margin >= 10 ? 'var(--orange)' : 'var(--red)' }}>
          {margin}%
        </span>
      </div>

      {/* Row 2: 4 stat boxes — Units / Revenue / Cost / Profit */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
        <div style={{ background:'var(--surface2)', borderRadius:8, padding:'6px 8px', textAlign:'center' }}>
          <p style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:3 }}>Units</p>
          <p style={{ fontSize:13, fontWeight:700, color:'var(--text)', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{item.units_sold}</p>
          <p style={{ fontSize:9, color:'var(--text3)', marginTop:2 }}>{item.unit}</p>
        </div>
        <div style={{ background:'var(--green-bg)', borderRadius:8, padding:'6px 8px', textAlign:'center' }}>
          <p style={{ fontSize:9, color:'var(--green)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:3 }}>Revenue</p>
          <p style={{ fontSize:11, fontWeight:700, color:'var(--green)', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{formatFull(revenue)}</p>
        </div>
        <div style={{ background:'var(--orange-bg)', borderRadius:8, padding:'6px 8px', textAlign:'center' }}>
          <p style={{ fontSize:9, color:'var(--orange)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:3 }}>Cost</p>
          <p style={{ fontSize:11, fontWeight:700, color:'var(--orange)', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{formatFull(cost)}</p>
        </div>
        <div style={{ background: isProfit ? 'var(--accent-bg)' : 'var(--red-bg)', borderRadius:8, padding:'6px 8px', textAlign:'center' }}>
          <p style={{ fontSize:9, color: isProfit ? 'var(--accent3)' : 'var(--red)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:3 }}>Profit</p>
          <p style={{ fontSize:11, fontWeight:700, color: isProfit ? 'var(--accent3)' : 'var(--red)', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{isProfit ? '+' : ''}{formatFull(profit)}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const { user }               = useAuth();
  const { formatFull, format } = useCurrency();
  const [period,     setPeriod]     = useState('today');
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [chartVisible, setChartVisible] = useState(true);

  const isAdvancedPlan = ADVANCED_PLANS.includes(user?.plan);

  const load = useCallback(async (p) => {
    setChartVisible(false);
    setLoading(true);
    await new Promise(r => setTimeout(r, 100));
    try {
      const res = await getAnalytics(p);
      setData(res.data.data);
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
      toast.error('3-month analytics require Premium or Deluxe plan.');
      return;
    }
    setPeriod(p);
  };

  const s          = data?.summary;
  const trendData  = data?.trend || [];
  const marginPct  = safeNumber(s?.revenue_period) > 0
    ? ((safeNumber(s.profit_period) / safeNumber(s.revenue_period)) * 100).toFixed(1) : 0;

  const exportAnalytics = () => {
    if (!data?.topItems?.length) { toast.error('No data to export.'); return; }
    const headers = ['Item','SKU','Units','Revenue','Cost','Profit','Margin %'];
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
    toast.success('Exported!');
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Analytics — StockWise</title></Head>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:12 }}>
            <div>
              <h1 className="page-title">Analytics</h1>
              <p className="page-subtitle">Revenue, profit & sales insights</p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
              <TransactionTypeLegend />
              {isAdvancedPlan && (
                <button onClick={exportAnalytics} className="btn-secondary"
                  style={{ height:34, paddingLeft:12, paddingRight:12, fontSize:12, gap:5 }}>
                  <Download size={13} /><span className="hidden sm:inline">Export</span>
                </button>
              )}
            </div>
          </div>

          {/* Period pill selector — Today / 7 Days / 3 Months only */}
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ display:'flex', padding:3, borderRadius:12, background:'var(--surface2)', border:'1px solid var(--border)', gap:2 }}>
              {PERIODS.map(({ key, label, advanced }) => {
                const locked = advanced && !isAdvancedPlan;
                const active = period === key;
                return (
                  <button key={key} onClick={() => handlePeriod(key)}
                    style={{
                      padding:'6px 14px', borderRadius:9, fontSize:12, fontWeight:600, border:'none',
                      background: active ? 'var(--accent)' : 'transparent',
                      color:      active ? '#fff' : locked ? 'var(--text3)' : 'var(--text2)',
                      cursor:'pointer', transition:'all 180ms ease',
                      display:'flex', alignItems:'center', gap:5,
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
                style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:9, fontSize:12, fontWeight:600, background:'var(--accent-bg)', color:'var(--accent3)', border:'1px solid var(--accent-border)', textDecoration:'none' }}>
                <Lock size={10} /> Unlock 3M
              </Link>
            )}
          </div>
        </div>

        {/* ── Loading state ──────────────────────────────────────────── */}
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 0' }}>
            <Spinner size="lg" />
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }} className="animate-fade-in">

            {/* ── Metric cards — 2 col mobile, 4 col desktop ─────────── */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}
              className="lg:grid-cols-4">
              <MetricCard icon={DollarSign}  label="Revenue"      color="green"
                value={formatFull(s?.revenue_period)}  tooltip={getTooltip('revenue')} />
              <MetricCard icon={TrendingUp}  label="Profit"       color="blue"
                value={formatFull(s?.profit_period)}   sub={`${marginPct}% margin`} tooltip={getTooltip('profit')} />
              <MetricCard icon={BarChart2}   label="Cost"         color="orange"
                value={formatFull(s?.cost_period)}     tooltip={getTooltip('cost')} />
              <MetricCard icon={ShoppingBag} label="Transactions" color="purple"
                value={s?.total_transactions || 0}     tooltip={getTooltip('transactions')} />
            </div>

            {/* Revenue explainer */}
            <RevenueExplainer summary={s} />

            {/* ── Chart ─────────────────────────────────────────────── */}
            <div className="card" style={{ padding:18 }}>
              <div style={{ marginBottom:14 }}>
                <p style={{ fontWeight:700, fontSize:14, color:'var(--text)', letterSpacing:'-0.2px' }}>
                  Revenue vs Profit vs Cost
                </p>
                <p style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>
                  {period === 'today' ? 'Hourly · today' : PERIODS.find(p2 => p2.key === period)?.label + ' breakdown'}
                </p>
              </div>
              <div style={{ opacity: chartVisible ? 1 : 0, transition:'opacity 180ms ease', height:'clamp(160px, 40vw, 240px)' }}>
                <PremiumAreaChart
                  data={trendData}
                  series={[
                    { key:'revenue', name:'Revenue', color:'var(--green)'   },
                    { key:'profit',  name:'Profit',  color:'var(--accent3)' },
                    { key:'cost',    name:'Cost',    color:'var(--orange)'  },
                  ]}
                  formatY={v => format(v, 0)}
                  height={typeof window !== 'undefined' && window.innerWidth < 640 ? 180 : 240}
                  chartKey={`analytics-${period}`}
                  showLegend={true}
                />
              </div>
            </div>

            {/* ── Item Performance ───────────────────────────────────── */}
            <div className="card" style={{ overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', borderBottom:'1px solid var(--border)' }}>
                <div>
                  <p style={{ fontWeight:700, fontSize:14, color:'var(--text)' }}>Item Performance</p>
                  <p style={{ fontSize:12, color:'var(--text3)', marginTop:1 }}>Revenue, cost & profit per item</p>
                </div>
              </div>

              {data?.topItems?.length > 0 ? (
                <>
                  {/* Mobile — compact card rows */}
                  <div className="block md:hidden">
                    {data.topItems.map((item, idx) => (
                      <MobileItemRow key={item.id} item={item} idx={idx} formatFull={formatFull} />
                    ))}
                  </div>

                  {/* Desktop — full table */}
                  <div className="hidden md:block">
                    <div className="table-scroll">
                      <table className="data-table">
                        <thead>
                          <tr>{['#','Item','Units','Revenue','Cost','Profit','Margin'].map(h => <th key={h}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {data.topItems.map((item, idx) => {
                            const profit   = Number(item.profit);
                            const isProfit = profit >= 0;
                            const margin   = Number(item.margin_pct);
                            const rankC    = idx < 3 ? ['var(--orange)','var(--text3)','var(--orange)'][idx] : 'var(--text3)';
                            return (
                              <tr key={item.id}>
                                <td>
                                  <span style={{ width:24, height:24, borderRadius:7, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, background:'var(--surface2)', color:rankC }}>
                                    {idx+1}
                                  </span>
                                </td>
                                <td>
                                  <p style={{ fontWeight:600, color:'var(--text)', fontSize:13 }}>{item.name}</p>
                                  {item.sku && <p style={{ fontSize:10, color:'var(--text3)', fontFamily:'monospace' }}>{item.sku}</p>}
                                </td>
                                <td style={{ fontWeight:600, fontVariantNumeric:'tabular-nums', color:'var(--text)' }}>
                                  {item.units_sold} {item.unit}
                                </td>
                                <td style={{ fontWeight:700, fontVariantNumeric:'tabular-nums', color:'var(--green)' }}>
                                  {formatFull(item.revenue)}
                                </td>
                                <td style={{ fontWeight:600, fontVariantNumeric:'tabular-nums', color:'var(--orange)' }}>
                                  {formatFull(item.total_cost)}
                                </td>
                                <td style={{ fontWeight:700, fontVariantNumeric:'tabular-nums', color: isProfit ? 'var(--green)' : 'var(--red)' }}>
                                  {isProfit ? '+' : ''}{formatFull(profit)}
                                </td>
                                <td>
                                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                    <div style={{ width:52, height:4, borderRadius:99, background:'var(--surface2)', overflow:'hidden', flexShrink:0 }}>
                                      <div style={{ height:'100%', width:`${Math.min(100, Math.max(0, margin))}%`, background: margin >= 30 ? 'var(--green)' : margin >= 10 ? 'var(--orange)' : 'var(--red)', borderRadius:99 }} />
                                    </div>
                                    <span style={{ fontSize:12, fontWeight:700, color:'var(--text2)' }}>{margin}%</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 16px', gap:8 }}>
                  <Package size={28} style={{ color:'var(--text3)', opacity:0.25 }} />
                  <p style={{ fontSize:13, color:'var(--text2)' }}>No sales in this period</p>
                </div>
              )}
            </div>

            {/* ── Period Summary ──────────────────────────────────────── */}
            {s && (
              <div className="card" style={{ padding:16 }}>
                <p style={{ fontWeight:700, fontSize:13, color:'var(--text)', marginBottom:12 }}>💡 Period Summary</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                  {[
                    { label:'Total Sales', value:formatFull(s.revenue_period),  sub:'From customers', bg:'var(--green-bg)',  border:'rgba(61,214,140,0.2)',  c:'var(--green)'   },
                    { label:'Total Cost',  value:formatFull(s.cost_period),    sub:'Cost of goods',  bg:'var(--orange-bg)', border:'rgba(255,139,62,0.2)',  c:'var(--orange)'  },
                    {
                      label:'Net Profit',
                      value: (safeNumber(s.profit_period) >= 0 ? '+' : '') + formatFull(s.profit_period),
                      sub: `${marginPct}% margin`,
                      bg:     safeNumber(s.profit_period) >= 0 ? 'var(--accent-bg)' : 'var(--red-bg)',
                      border: safeNumber(s.profit_period) >= 0 ? 'rgba(123,123,248,0.2)' : 'rgba(242,85,90,0.2)',
                      c:      safeNumber(s.profit_period) >= 0 ? 'var(--accent3)' : 'var(--red)',
                    },
                  ].map(({ label, value, sub, bg, border, c }) => (
                    <div key={label} style={{ padding:'12px 10px', borderRadius:12, textAlign:'center', background:bg, border:`1px solid ${border}` }}>
                      <p style={{ fontSize:10, fontWeight:700, color:c, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5 }}>{label}</p>
                      <p style={{ fontSize:'clamp(13px,3.5vw,17px)', fontWeight:800, color:c, fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{value}</p>
                      <p style={{ fontSize:10, color:'var(--text3)', marginTop:4 }}>{sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
