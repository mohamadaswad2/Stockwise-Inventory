import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Users, TrendingUp, CreditCard, UserCheck, Lock, Unlock, Search, ChevronDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../contexts/AuthContext';
import * as adminService from '../../services/admin.service';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PLANS = ['free','starter','premium','deluxe'];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs">
      <p className="font-bold mb-1" style={{ color: 'var(--text)' }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>)}
    </div>
  );
}

export default function AdminPage() {
  const { user }  = useAuth();
  const router    = useRouter();
  const [stats,   setStats]   = useState(null);
  const [trend,   setTrend]   = useState([]);
  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);

  useEffect(() => { if (user && user.role !== 'admin') router.replace('/dashboard'); }, [user, router]);

  useEffect(() => {
    adminService.getAdminStats()
      .then(r => { setStats(r.data.data.stats); setTrend(r.data.data.trend); })
      .catch(() => toast.error('Failed to load stats.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    adminService.getAdminUsers({ search, page, limit: 15 })
      .then(r => { setUsers(r.data.data.users); setTotal(r.data.data.total); })
      .catch(() => {});
  }, [search, page]);

  const handleToggleLock = async (id, locked) => {
    try {
      const res = await adminService.toggleUserLock(id);
      setUsers(u => u.map(x => x.id === id ? { ...x, is_locked: !x.is_locked } : x));
      toast.success(res.data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed.'); }
  };

  const handleChangePlan = async (id, plan) => {
    try {
      const res = await api.patch(`/admin/users/${id}/plan`, { plan });
      setUsers(u => u.map(x => x.id === id ? { ...x, plan, is_locked: x.is_locked && plan === 'free' } : x));
      toast.success(res.data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update plan.'); }
  };

  const planColor = { deluxe: 'badge-blue', premium: 'badge-purple', starter: 'badge-green', free: 'badge-yellow' };

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Admin Panel — StockWise</title></Head>
        <div className="mb-5">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Admin Panel</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text2)' }}>Monitor your SaaS platform</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
        ) : (
          <div className="space-y-5 animate-ios-in">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: Users,      label: 'Total Users',    value: stats?.total_users,    color: 'rgba(99,102,241,0.12)',  c: 'var(--accent3)' },
                { icon: CreditCard, label: 'Deluxe Users',   value: stats?.deluxe_users,   color: 'rgba(168,85,247,0.12)', c: 'var(--purple)' },
                { icon: UserCheck,  label: 'Verified',       value: stats?.verified_users, color: 'rgba(34,197,94,0.12)',  c: 'var(--green)' },
                { icon: TrendingUp, label: 'New This Month', value: stats?.new_this_month, color: 'rgba(245,158,11,0.12)', c: 'var(--orange)' },
              ].map(({ icon: Icon, label, value, color, c }) => (
                <div key={label} className="card p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: color }}>
                    <Icon size={18} style={{ color: c }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text3)' }}>{label}</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{value ?? '—'}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Plan breakdown */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Starter',  value: stats?.starter_users, color: 'var(--green)' },
                { label: 'Premium',  value: stats?.premium_users, color: 'var(--purple)' },
                { label: 'Free',     value: stats?.free_users,    color: 'var(--text2)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="card p-4 text-center">
                  <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{value ?? 0}</p>
                  <p className="text-xs font-bold mt-1" style={{ color }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Signup trend */}
            <div className="card p-5">
              <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>Signups — Last 30 Days</h3>
              {trend?.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={trend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--surface3)" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text3)', fontSize: 10 }}
                      tickFormatter={d => d?.slice(5)} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="count" name="Signups" stroke="#8b5cf6" strokeWidth={2} fill="url(#adminGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-center py-8" style={{ color: 'var(--text3)' }}>No signups yet.</p>
              )}
            </div>

            {/* Users table */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between gap-4"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  All Users <span style={{ color: 'var(--text3)' }}>({total})</span>
                </h3>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }} />
                  <input className="input pl-8 py-1.5 text-xs w-44" placeholder="Search…"
                    value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                      {['Name','Email','Plan','Verified','Status','Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-bold uppercase tracking-wider"
                          style={{ color: 'var(--text3)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td className="px-4 py-3 font-semibold whitespace-nowrap" style={{ color: 'var(--text)' }}>{u.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text2)' }}>{u.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {/* Plan selector */}
                          <div className="relative">
                            <select
                              value={u.plan}
                              onChange={e => handleChangePlan(u.id, e.target.value)}
                              className="text-xs font-bold px-2 py-1 rounded-lg pr-6 appearance-none cursor-pointer"
                              style={{
                                background: 'var(--surface3)',
                                color: 'var(--text)',
                                border: '1px solid var(--border2)',
                              }}>
                              {PLANS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                            </select>
                            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
                              style={{ color: 'var(--text3)' }} />
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={u.is_email_verified ? 'badge badge-green' : 'badge badge-yellow'}>
                            {u.is_email_verified ? '✓' : '✗'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={u.is_locked ? 'badge badge-red' : 'badge badge-green'}>
                            {u.is_locked ? 'Locked' : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button onClick={() => handleToggleLock(u.id, u.is_locked)}
                            className="btn text-xs py-1 px-3 rounded-lg font-semibold"
                            style={{
                              background: u.is_locked ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                              color: u.is_locked ? 'var(--green)' : 'var(--red)',
                            }}>
                            {u.is_locked ? <><Unlock size={11}/> Unlock</> : <><Lock size={11}/> Lock</>}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
