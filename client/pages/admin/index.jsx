import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Users, TrendingUp, CreditCard, UserCheck,
  Lock, Unlock, Search, ChevronDown,
  Megaphone, Plus, Trash2, Zap, Wrench, Star, X,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PremiumAreaChart from '../../components/charts/PremiumAreaChart';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../contexts/AuthContext';
import * as adminService from '../../services/admin.service';
import { createUpdate, deleteUpdate, getUpdates } from '../../services/updates.service';
import api from '../../services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const PLANS = ['free','starter','premium','deluxe'];
const UPDATE_TYPES = [
  { key: 'feature',      label: 'New Feature',  icon: Star,      color: 'var(--accent3)' },
  { key: 'update',       label: 'Update',       icon: Zap,       color: 'var(--green)' },
  { key: 'fix',          label: 'Bug Fix',      icon: Wrench,    color: 'var(--orange)' },
  { key: 'announcement', label: 'Announcement', icon: Megaphone, color: 'var(--purple)' },
];

const TABS = ['users', 'updates'];

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
  const [tab,     setTab]     = useState('users');
  const [stats,   setStats]   = useState(null);
  const [trend,   setTrend]   = useState([]);
  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);

  // Updates state
  const [updates,     setUpdates]     = useState([]);
  const [updLoading,  setUpdLoading]  = useState(false);
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState({ title: '', content: '', version: '', type: 'feature' });
  const [posting,     setPosting]     = useState(false);

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

  const loadUpdates = () => {
    setUpdLoading(true);
    getUpdates({ limit: 30 })
      .then(r => setUpdates(r.data.data.updates || []))
      .catch(() => toast.error('Failed to load updates.'))
      .finally(() => setUpdLoading(false));
  };

  useEffect(() => { if (tab === 'updates') loadUpdates(); }, [tab]);

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
      setUsers(u => u.map(x => x.id === id ? { ...x, plan } : x));
      toast.success(res.data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const handlePostUpdate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) { toast.error('Title and content required.'); return; }
    setPosting(true);
    try {
      await createUpdate(form);
      toast.success('Update posted!');
      setForm({ title: '', content: '', version: '', type: 'feature' });
      setShowForm(false);
      loadUpdates();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to post.'); }
    finally { setPosting(false); }
  };

  const handleDeleteUpdate = async (id) => {
    if (!confirm('Delete this update?')) return;
    try {
      await deleteUpdate(id);
      toast.success('Deleted.');
      setUpdates(u => u.filter(x => x.id !== id));
    } catch { toast.error('Failed to delete.'); }
  };

  const typeConfig = Object.fromEntries(UPDATE_TYPES.map(t => [t.key, t]));

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Admin Panel — StockWise</title></Head>
        <div className="mb-5">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Admin Panel</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text2)' }}>Manage users and platform</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
        ) : (
          <div className="space-y-5 animate-ios-in">
            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: Users,      label: 'Total Users',    value: stats?.total_users,    bg: 'rgba(99,102,241,0.12)',  c: 'var(--accent3)' },
                { icon: CreditCard, label: 'Deluxe Users',   value: stats?.deluxe_users,   bg: 'rgba(168,85,247,0.12)', c: 'var(--purple)' },
                { icon: UserCheck,  label: 'Verified',       value: stats?.verified_users, bg: 'rgba(34,197,94,0.12)',  c: 'var(--green)' },
                { icon: TrendingUp, label: 'New This Month', value: stats?.new_this_month, bg: 'rgba(245,158,11,0.12)', c: 'var(--orange)' },
              ].map(({ icon: Icon, label, value, bg, c }) => (
                <div key={label} className="card p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: bg }}>
                    <Icon size={18} style={{ color: c }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text3)' }}>{label}</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{value ?? '—'}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Signup trend */}
            <div className="card p-5">
              <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>Signups — Last 30 Days</h3>
              <PremiumAreaChart
                data={trend || []}
                series={[{ key: 'count', name: 'Signups', color: 'var(--purple)' }]}
                formatY={v => String(Math.round(v))}
                height={160}
                chartKey="admin-signups"
                showLegend={false}
              />
            </div>

            {/* Tabs: Users | Updates */}
            <div>
              <div className="flex gap-1 mb-4">
                {TABS.map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={clsx('px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize',
                      tab === t ? 'text-white' : '')}
                    style={{
                      background: tab === t ? 'linear-gradient(135deg,var(--accent),var(--accent2))' : 'var(--surface2)',
                      color: tab === t ? '#fff' : 'var(--text2)',
                    }}>
                    {t === 'updates' ? '📣 Updates' : '👥 Users'}
                  </button>
                ))}
              </div>

              {/* ── USERS TAB ── */}
              {tab === 'users' && (
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
                          {['Name','Email','Plan','Verified','Status','Action'].map(h => (
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
                              <div className="relative">
                                <select value={u.plan} onChange={e => handleChangePlan(u.id, e.target.value)}
                                  className="text-xs font-bold px-2 py-1 rounded-lg pr-6 appearance-none cursor-pointer"
                                  style={{ background: 'var(--surface3)', color: 'var(--text)', border: '1px solid var(--border2)' }}>
                                  {PLANS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                                </select>
                                <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                  style={{ color: 'var(--text3)' }} />
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={u.is_email_verified ? 'badge badge-green' : 'badge badge-yellow'}>
                                {u.is_email_verified ? '✓ Yes' : '✗ No'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={u.is_locked ? 'badge badge-red' : 'badge badge-green'}>
                                {u.is_locked ? 'Locked' : 'Active'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <button onClick={() => handleToggleLock(u.id, u.is_locked)}
                                className="btn text-xs py-1 px-3 rounded-lg font-semibold flex items-center gap-1"
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
              )}

              {/* ── UPDATES TAB ── */}
              {tab === 'updates' && (
                <div className="space-y-4">
                  {/* Post button */}
                  <div className="flex justify-end">
                    <button onClick={() => setShowForm(v => !v)}
                      className="btn-primary flex items-center gap-2 text-sm">
                      {showForm ? <><X size={14}/> Cancel</> : <><Plus size={14}/> Post Update</>}
                    </button>
                  </div>

                  {/* Post form */}
                  {showForm && (
                    <div className="card p-5 animate-fade-in">
                      <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>
                        New Update Post
                      </h3>
                      <form onSubmit={handlePostUpdate} className="space-y-3">
                        {/* Type selector */}
                        <div>
                          <label className="label">Type</label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {UPDATE_TYPES.map(({ key, label, icon: Icon, color }) => (
                              <button key={key} type="button"
                                onClick={() => setForm(f => ({ ...f, type: key }))}
                                className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition-all"
                                style={{
                                  background: form.type === key ? `${color}20` : 'var(--surface2)',
                                  border: `1.5px solid ${form.type === key ? color : 'var(--border)'}`,
                                  color: form.type === key ? color : 'var(--text2)',
                                }}>
                                <Icon size={13} /> {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="label">Title *</label>
                            <input type="text" className="input" placeholder="e.g. Analytics Page Launched"
                              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                          </div>
                          <div>
                            <label className="label">Version (optional)</label>
                            <input type="text" className="input" placeholder="e.g. 1.2.0"
                              value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
                          </div>
                        </div>

                        <div>
                          <label className="label">Content *</label>
                          <textarea rows={4} className="input resize-none"
                            placeholder="Describe what's new, what was fixed, or what changed…"
                            value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required />
                        </div>

                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">
                            Cancel
                          </button>
                          <button type="submit" disabled={posting} className="btn-primary text-sm">
                            {posting ? 'Posting…' : 'Publish Update'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Updates list */}
                  {updLoading ? (
                    <div className="flex justify-center py-12"><Spinner size="lg" /></div>
                  ) : updates.length === 0 ? (
                    <div className="card flex flex-col items-center justify-center py-12 text-center">
                      <Megaphone size={28} className="mb-2 opacity-20" style={{ color: 'var(--text3)' }} />
                      <p className="text-sm" style={{ color: 'var(--text2)' }}>No updates posted yet.</p>
                    </div>
                  ) : updates.map(u => {
                    const cfg  = typeConfig[u.type] || typeConfig.update;
                    const Icon = cfg.icon;
                    const date = new Date(u.created_at).toLocaleDateString('en-MY', {
                      day:'numeric', month:'short', year:'numeric',
                    });
                    return (
                      <div key={u.id} className="card p-4 flex gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${cfg.color}20` }}>
                          <Icon size={14} style={{ color: cfg.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                            {u.version && (
                              <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                                style={{ background: 'var(--surface2)', color: 'var(--text3)' }}>
                                v{u.version}
                              </span>
                            )}
                            <span className="text-xs" style={{ color: 'var(--text3)' }}>{date}</span>
                          </div>
                          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>{u.title}</p>
                          <p className="text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>
                            {u.content.slice(0, 150)}{u.content.length > 150 ? '…' : ''}
                          </p>
                        </div>
                        <button onClick={() => handleDeleteUpdate(u.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all self-start"
                          style={{ color: 'var(--red)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
