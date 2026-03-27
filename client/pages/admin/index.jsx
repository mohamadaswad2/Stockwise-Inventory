import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Users, TrendingUp, CreditCard, UserCheck,
  Lock, Unlock, Search,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import * as adminService from '../../services/admin.service';
import toast from 'react-hot-toast';
import clsx from 'clsx';

function AdminStatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue:   'bg-sky-50 dark:bg-sky-900/20 text-sky-600',
    purple: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600',
    green:  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
    amber:  'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
  };
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', colors[color])}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-white">{value ?? '—'}</p>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user }    = useAuth();
  const { isDark }  = useTheme();
  const router      = useRouter();
  const [stats,     setStats]     = useState(null);
  const [trend,     setTrend]     = useState([]);
  const [users,     setUsers]     = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [page,      setPage]      = useState(1);

  // Guard — admin only
  useEffect(() => {
    if (user && user.role !== 'admin') router.replace('/dashboard');
  }, [user, router]);

  useEffect(() => {
    adminService.getAdminStats()
      .then(r => { setStats(r.data.data.stats); setTrend(r.data.data.trend); })
      .catch(() => toast.error('Failed to load admin stats.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    adminService.getAdminUsers({ search, page, limit: 15 })
      .then(r => { setUsers(r.data.data.users); setTotal(r.data.data.total); })
      .catch(() => {});
  }, [search, page]);

  const handleToggleLock = async (id, locked) => {
    try {
      await adminService.toggleUserLock(id);
      setUsers(u => u.map(x => x.id === id ? { ...x, is_locked: !x.is_locked } : x));
      toast.success(locked ? 'User unlocked.' : 'User locked.');
    } catch { toast.error('Action failed.'); }
  };

  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#1e293b' : '#f1f5f9';

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Admin Panel — StockWise</title></Head>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Admin Panel</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Monitor your SaaS platform</p>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <AdminStatCard icon={Users}     label="Total Users"    value={stats?.total_users}   color="blue" />
              <AdminStatCard icon={CreditCard} label="Deluxe Users"   value={stats?.deluxe_users}  color="purple" />
              <AdminStatCard icon={UserCheck} label="Verified"        value={stats?.verified_users} color="green" />
              <AdminStatCard icon={TrendingUp} label="New This Month" value={stats?.new_this_month} color="amber" />
            </div>

            {/* Signup trend chart */}
            <div className="card p-5 mb-6">
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm mb-4">
                New Signups — Last 30 Days
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: textColor, fontSize: 10 }}
                    tickFormatter={d => d?.slice(5)} />
                  <YAxis tick={{ fill: textColor, fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" name="Signups"
                    stroke="#8b5cf6" strokeWidth={2} fill="url(#adminGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Plan breakdown */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Starter',  value: stats?.starter_users,  color: 'badge-green' },
                { label: 'Premium',  value: stats?.premium_users,  color: 'badge-purple' },
                { label: 'Free',     value: stats?.free_users,     color: 'badge-blue' },
              ].map(({ label, value, color }) => (
                <div key={label} className="card p-4 text-center">
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{value ?? 0}</p>
                  <span className={clsx('mt-1', color)}>{label}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Users table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
            <h3 className="font-semibold text-slate-800 dark:text-white text-sm">
              All Users <span className="text-slate-400 font-normal">({total})</span>
            </h3>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-8 py-1.5 text-xs w-48" placeholder="Search users…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  {['Name','Email','Plan','Verified','Trial Ends','Status','Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{u.name}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{u.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={clsx('badge',
                        u.plan === 'deluxe'  ? 'badge-blue' :
                        u.plan === 'premium' ? 'badge-purple' :
                        u.plan === 'starter' ? 'badge-green' : 'badge-yellow')}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={u.is_email_verified ? 'badge-green' : 'badge-yellow'}>
                        {u.is_email_verified ? '✓ Yes' : '✗ No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                      {u.trial_ends_at ? new Date(u.trial_ends_at).toLocaleDateString('en-MY') : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={u.is_locked ? 'badge-red' : 'badge-green'}>
                        {u.is_locked ? 'Locked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button onClick={() => handleToggleLock(u.id, u.is_locked)}
                        className={clsx('btn text-xs py-1 px-2',
                          u.is_locked ? 'btn-secondary' : 'btn-danger')}>
                        {u.is_locked ? <><Unlock size={12}/> Unlock</> : <><Lock size={12}/> Lock</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
