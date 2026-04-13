import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { DollarSign, ShoppingBag, TrendingUp, Package, ArrowRight, BarChart2, Receipt } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import Spinner from '../../components/ui/Spinner';
import { getSalesSummary, getTransactions } from '../../services/transaction.service';
import { useCurrency } from '../../contexts/CurrencyContext';
import TransactionList from '../../components/analytics/TransactionList';

function ChartTooltip({ active, payload, label, formatFn }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-lg" style={{ border: '1px solid var(--border2)' }}>
      <p className="font-bold mb-1.5" style={{ color: 'var(--text)' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span style={{ color: 'var(--text2)' }}>{p.name}</span>
          </span>
          <span className="font-bold" style={{ color: p.color }}>{formatFn(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function SalesPage() {
  const { formatFull, format } = useCurrency();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryRes, txRes] = await Promise.all([
        getSalesSummary('1m'),
        getTransactions({ limit: 50 })
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

  useEffect(() => {
    loadData();
  }, []);

  const s        = data?.sales;
  const topItems = data?.topItems || [];
  const trend    = data?.trend    || [];
  const totRev   = Number(s?.total_revenue    || 0);
  const totRev30 = Number(s?.revenue_30d      || 0);
  const totUnits = Number(s?.total_units_sold || 0);
  const totTx    = Number(s?.total_transactions || 0);

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Sales — StockWise</title></Head>

        <div className="flex items-start justify-between mb-5 gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Sales</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text2)' }}>Last 30 days overview</p>
          </div>
          <Link href="/analytics" className="btn-secondary text-sm flex items-center gap-2">
            <BarChart2 size={14} /> Full Analytics
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
        ) : (
          <div className="space-y-5 animate-ios-in">

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: DollarSign,  label: 'Total Revenue', value: formatFull(totRev),    bg: 'rgba(34,197,94,0.12)',  c: 'var(--green)' },
                { icon: TrendingUp,  label: 'Last 30 Days',  value: formatFull(totRev30),  bg: 'rgba(99,102,241,0.12)', c: 'var(--accent3)' },
                { icon: ShoppingBag, label: 'Transactions',  value: totTx,                  bg: 'rgba(245,158,11,0.12)', c: 'var(--orange)' },
                { icon: Package,     label: 'Units Sold',    value: totUnits,               bg: 'rgba(168,85,247,0.12)', c: 'var(--purple)' },
              ].map(({ icon: Icon, label, value, bg, c }) => (
                <div key={label} className="card p-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
                    <Icon size={17} style={{ color: c }} />
                  </div>
                  <p className="text-2xl font-black tabular-nums" style={{ color: 'var(--text)' }}>{value}</p>
                  <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text3)' }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Revenue chart */}
            <div className="card p-5">
              <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>
                Revenue — Last 30 Days
              </h3>
              {trend.length >= 2 ? (
                <ResponsiveContainer width="100%" height={220} key="sales-trend">
                  <AreaChart
                    data={trend}
                    margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                    <defs>
                      {[
                        { id: 'sRev',    color: '#22c55e' },
                        { id: 'sProfit', color: '#6366f1' },
                        { id: 'sCost',   color: '#f59e0b' },
                      ].map(({ id, color }) => (
                        <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid stroke="var(--surface3)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date"
                      tick={{ fill: 'var(--text3)', fontSize: 10 }}
                      tickFormatter={d => {
                        if (!d) return '';
                        if (d.includes(':')) return d;
                        return d.slice(5);
                      }}
                      axisLine={false} tickLine={false} tickMargin={8}
                      interval="preserveStartEnd" />
                    <YAxis
                      tick={{ fill: 'var(--text3)', fontSize: 10 }}
                      axisLine={false} tickLine={false}
                      tickFormatter={v => format(v, 0)}
                      width={56} tickMargin={4}
                      domain={trend.some(d => (d.revenue||0) > 0) ? ['auto','auto'] : [0, 1]} />
                    <Tooltip content={<ChartTooltip formatFn={format} />}
                      cursor={{ stroke: 'var(--border2)', strokeWidth: 1 }} />
                    <Legend iconType="circle" iconSize={7}
                      formatter={v => <span style={{ fontSize: 11, color: 'var(--text2)' }}>{v}</span>} />
                    <Area type="monotone" dataKey="revenue" name="Revenue"
                      stroke="#22c55e" strokeWidth={1.5} fill="url(#sRev)"
                      dot={false} activeDot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }}
                      isAnimationActive={false} />
                    <Area type="monotone" dataKey="profit" name="Profit"
                      stroke="#6366f1" strokeWidth={1.5} fill="url(#sProfit)"
                      dot={false} activeDot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                      isAnimationActive={false} />
                    <Area type="monotone" dataKey="cost" name="Cost"
                      stroke="#f59e0b" strokeWidth={1.5} fill="url(#sCost)"
                      dot={false} activeDot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                      isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-36" style={{ color: 'var(--text3)' }}>
                  <ShoppingBag size={28} className="mb-2 opacity-20" />
                  <p className="text-sm">No sales yet.</p>
                  <Link href="/inventory" className="text-xs mt-2 font-medium" style={{ color: 'var(--accent3)' }}>
                    Record your first sale →
                  </Link>
                </div>
              )}
            </div>

            {/* Top items */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Top Selling Items</h3>
                <Link href="/analytics" className="text-xs font-semibold flex items-center gap-1"
                  style={{ color: 'var(--accent3)' }}>
                  Full breakdown <ArrowRight size={12} />
                </Link>
              </div>
              {topItems.length > 0 ? topItems.slice(0, 5).map((item, idx) => (
                <div key={item.id} className="list-row">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                    style={{ background: ['#f59e0b','#94a3b8','#b45309','#6366f1','#8b5cf6'][idx] || '#6366f1' }}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{item.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text3)' }}>{item.units_sold} {item.unit} sold</p>
                  </div>
                  <span className="text-sm font-bold tabular-nums flex-shrink-0" style={{ color: 'var(--green)' }}>
                    {formatFull(item.revenue)}
                  </span>
                </div>
              )) : (
                <div className="flex items-center justify-center py-10" style={{ color: 'var(--text3)' }}>
                  <p className="text-sm">No sales data yet.</p>
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  <span className="flex items-center gap-2">
                    <Receipt size={16} style={{ color: 'var(--accent3)' }} />
                    Recent Transactions
                  </span>
                </h3>
              </div>
              {txLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="sm" />
                </div>
              ) : (
                <TransactionList
                  transactions={transactions}
                  onRefundSuccess={loadData}
                />
              )}
            </div>

            {/* CTA */}
            <Link href="/analytics"
              className="card p-4 flex items-center justify-between transition-all duration-200"
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.12)' }}>
                  <BarChart2 size={18} style={{ color: 'var(--accent3)' }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>View Full Analytics</p>
                  <p className="text-xs" style={{ color: 'var(--text2)' }}>Profit breakdown, period comparison, export</p>
                </div>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--accent3)' }} />
            </Link>

          </div>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
