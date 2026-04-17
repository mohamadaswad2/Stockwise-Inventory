import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  DollarSign, ShoppingBag, TrendingUp, Package, ArrowRight,
  BarChart2, Receipt, HelpCircle, TrendingDown,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import Spinner from '../../components/ui/Spinner';
import { getSalesSummary, getTransactions } from '../../services/transaction.service';
import { useCurrency } from '../../contexts/CurrencyContext';
import TransactionList from '../../components/analytics/TransactionList';
import { getTooltip } from '../../config/tooltips.config';

/* ── Chart tooltip ──────────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label, formatFn }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: '10px 14px', border: '1px solid var(--border2)', boxShadow: 'var(--shadow-md)' }}>
      <p style={{ fontWeight: 700, fontSize: 12, color: 'var(--text)', marginBottom: 8 }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
            {p.name}
          </span>
          <span style={{ fontWeight: 700, fontSize: 12, color: p.color, fontVariantNumeric: 'tabular-nums' }}>
            {formatFn(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Stat card ──────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color, bg, tooltip, trend }) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 'var(--r-md)', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={17} style={{ color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
            {tooltip && (
              <div style={{ position: 'relative', display: 'inline-flex' }}
                onMouseEnter={() => setShowTip(true)}
                onMouseLeave={() => setShowTip(false)}>
                <HelpCircle size={12} style={{ color: 'var(--text3)', opacity: 0.6, cursor: 'help' }} />
                {showTip && <div className="tooltip-content" style={{ whiteSpace: 'nowrap' }}>{tooltip}</div>}
              </div>
            )}
          </div>
          <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function SalesPage() {
  const { formatFull, format } = useCurrency();
  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [txLoading,    setTxLoading]    = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryRes, txRes] = await Promise.all([
        getSalesSummary('1m'),
        getTransactions({ limit: 50 }),
      ]);
      setData(summaryRes.data.data);
      setTransactions(txRes.data.data?.transactions || []);
    } catch {
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
      setTxLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const s        = data?.sales;
  const topItems = data?.topItems || [];
  const trend    = data?.trend    || [];
  const totRev   = Number(s?.total_revenue     || 0);
  const totRev30 = Number(s?.revenue_30d       || 0);
  const totUnits = Number(s?.total_units_sold  || 0);
  const totTx    = Number(s?.total_transactions|| 0);

  if (loading) {
    return (
      <ProtectedRoute><AppLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <Spinner size="lg" />
        </div>
      </AppLayout></ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Sales — StockWise</title></Head>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
          <div>
            <h1 className="page-title">Sales</h1>
            <p className="page-subtitle">Last 30 days overview</p>
          </div>
          <Link href="/analytics" className="btn-secondary" style={{ fontSize: 13, height: 36, paddingLeft: 14, paddingRight: 14, flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <BarChart2 size={14} /> <span className="hidden sm:inline">Full Analytics</span>
          </Link>
        </div>

        <div className="animate-ios-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Stats grid — responsive ──────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
            <StatCard icon={DollarSign}  label="All-Time Revenue" value={formatFull(totRev)}   color="var(--green)"   bg="var(--green-bg)"   tooltip={getTooltip('totalRevenue')} />
            <StatCard icon={TrendingUp}  label="Last 30 Days"     value={formatFull(totRev30)} color="var(--accent3)" bg="var(--accent-bg)"  tooltip={getTooltip('last30Days')} />
            <StatCard icon={ShoppingBag} label="Transactions"     value={totTx}                color="var(--orange)"  bg="var(--orange-bg)"  tooltip={getTooltip('transactions')} />
            <StatCard icon={Package}     label="Units Sold"       value={totUnits}             color="var(--purple)"  bg="var(--purple-bg)"  tooltip={getTooltip('unitsSold')} />
          </div>

          {/* ── Revenue chart ────────────────────────────────────────── */}
          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 16, letterSpacing: '-0.2px' }}>
              Revenue — Last 30 Days
            </p>
            {trend.length >= 2 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trend} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    {[
                      { id: 'gRev',    color: 'var(--green)'   },
                      { id: 'gProfit', color: 'var(--accent3)' },
                      { id: 'gCost',   color: 'var(--orange)'  },
                    ].map(({ id, color }) => (
                      <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={color} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date"
                    tick={{ fill: 'var(--text3)', fontSize: 10 }}
                    tickFormatter={d => d?.includes(':') ? d : d?.slice(5) || ''}
                    axisLine={false} tickLine={false} tickMargin={8}
                    interval="preserveStartEnd" />
                  <YAxis
                    tick={{ fill: 'var(--text3)', fontSize: 10 }}
                    axisLine={false} tickLine={false}
                    tickFormatter={v => format(v, 0)} width={52} tickMargin={4} />
                  <Tooltip content={<ChartTooltip formatFn={format} />}
                    cursor={{ stroke: 'var(--border2)', strokeWidth: 1 }} />
                  <Legend iconType="circle" iconSize={7}
                    formatter={v => <span style={{ fontSize: 11, color: 'var(--text2)' }}>{v}</span>} />
                  <Area type="monotone" dataKey="revenue" name="Revenue"
                    stroke="var(--green)" strokeWidth={1.5} fill="url(#gRev)"
                    dot={false} activeDot={{ r: 3, strokeWidth: 0 }} isAnimationActive={false} />
                  <Area type="monotone" dataKey="profit" name="Profit"
                    stroke="var(--accent3)" strokeWidth={1.5} fill="url(#gProfit)"
                    dot={false} activeDot={{ r: 3, strokeWidth: 0 }} isAnimationActive={false} />
                  <Area type="monotone" dataKey="cost" name="Cost"
                    stroke="var(--orange)" strokeWidth={1.5} fill="url(#gCost)"
                    dot={false} activeDot={{ r: 3, strokeWidth: 0 }} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 140, color: 'var(--text3)', gap: 8 }}>
                <ShoppingBag size={28} style={{ opacity: 0.2 }} />
                <p style={{ fontSize: 13 }}>No sales yet</p>
                <Link href="/inventory" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent3)' }}>
                  Record your first sale →
                </Link>
              </div>
            )}
          </div>

          {/* ── Top items ────────────────────────────────────────────── */}
          {topItems.length > 0 && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Top Selling Items</p>
                <Link href="/analytics" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Full breakdown <ArrowRight size={12} />
                </Link>
              </div>
              {topItems.slice(0, 5).map((item, idx) => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderBottom: idx < 4 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: '#fff',
                    background: ['#f59e0b','#94a3b8','#b45309','#6366f1','#8b5cf6'][idx] || '#6366f1',
                  }}>{idx + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }} className="truncate">{item.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text3)' }}>{item.units_sold} {item.unit} sold</p>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--green)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    {formatFull(item.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ── Recent transactions ──────────────────────────────────── */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              <Receipt size={15} style={{ color: 'var(--accent3)', flexShrink: 0 }} />
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Recent Transactions</p>
            </div>
            {txLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
                <Spinner size="sm" />
              </div>
            ) : (
              <TransactionList transactions={transactions} onRefundSuccess={loadData} />
            )}
          </div>

          {/* ── CTA to analytics ─────────────────────────────────────── */}
          <Link href="/analytics"
            className="card"
            style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer', transition: 'all var(--t-md)', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BarChart2 size={18} style={{ color: 'var(--accent3)' }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>View Full Analytics</p>
                <p style={{ fontSize: 12, color: 'var(--text3)' }}>Profit, cost, margin & period comparison</p>
              </div>
            </div>
            <ArrowRight size={16} style={{ color: 'var(--accent3)', flexShrink: 0 }} />
          </Link>

        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
