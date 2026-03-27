import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import clsx from 'clsx';
import {
  LayoutDashboard, Package, LogOut, Menu, X,
  Sun, Moon, Boxes, Settings, ChevronRight,
  ShieldAlert, User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import TrialBanner from '../ui/TrialBanner';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory',  label: 'Inventory',  icon: Package },
];

export default function AppLayout({ children }) {
  const { user, logout }   = useAuth();
  const { isDark, toggle } = useTheme();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0a0f1e] transition-colors duration-300">
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed lg:static inset-y-0 left-0 z-30 flex flex-col w-64',
        'bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800',
        'transition-transform duration-300',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-glow">
            <Boxes size={16} className="text-white" />
          </div>
          <span className="font-bold text-slate-800 dark:text-white tracking-tight">StockWise</span>
          <button className="ml-auto lg:hidden text-slate-400 hover:text-slate-600" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = router.pathname.startsWith(href);
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                )}>
                <Icon size={17} />
                {label}
                {active && <ChevronRight size={14} className="ml-auto opacity-40" />}
              </Link>
            );
          })}

          {/* Admin link */}
          {isAdmin && (
            <Link href="/admin" onClick={() => setOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 mt-2',
                router.pathname.startsWith('/admin')
                  ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}>
              <ShieldAlert size={17} />
              Admin Panel
              {router.pathname.startsWith('/admin') && <ChevronRight size={14} className="ml-auto opacity-40" />}
            </Link>
          )}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-slate-100 dark:border-slate-800 space-y-1">
          {/* Theme toggle */}
          <button onClick={toggle}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>

          {/* Profile */}
          <button onClick={() => { setProfileOpen(true); setOpen(false); }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <Settings size={16} />
            Settings
          </button>

          <button onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all">
            <LogOut size={16} />
            Sign Out
          </button>

          {/* User chip */}
          <div className="flex items-center gap-3 px-3 py-2 mt-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.plan} plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex items-center px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 gap-4 flex-shrink-0 sticky top-0 z-10">
          <button className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
          <h1 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {NAV.find(n => router.pathname.startsWith(n.href))?.label ?? 'StockWise'}
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <button onClick={toggle}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={() => setProfileOpen(true)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </button>
          </div>
        </header>

        {/* Trial banner */}
        <TrialBanner user={user} />

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          {children}
        </main>
      </div>

      {/* Profile/Settings modal */}
      {profileOpen && <ProfileModal user={user} onClose={() => setProfileOpen(false)} />}
    </div>
  );
}

// ── Inline Profile/Settings Modal ─────────────────────────────────────────────
import { useRef } from 'react';
import toast from 'react-hot-toast';
import * as authService from '../../services/auth.service';

function ProfileModal({ user, onClose }) {
  const [tab, setTab] = useState('profile');
  const [pw, setPw]   = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const handleChangePw = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) { toast.error('Passwords do not match.'); return; }
    if (pw.newPassword.length < 8)     { toast.error('New password too short.'); return; }
    setSaving(true);
    try {
      await authService.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success('Password changed!');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md card p-0 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-semibold text-slate-800 dark:text-white">Account Settings</h2>
          <button onClick={onClose} className="btn-ghost p-1 rounded-lg"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          {[['profile','Profile'],['password','Password']].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={clsx('flex-1 py-3 text-sm font-medium transition-colors',
                tab === t ? 'text-sky-600 border-b-2 border-sky-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200')}>
              {l}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'profile' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">{user?.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
                  <span className={clsx('badge mt-1', user?.plan === 'deluxe' ? 'badge-blue' : user?.plan === 'premium' ? 'badge-purple' : 'badge-green')}>
                    {user?.plan?.toUpperCase()} plan
                  </span>
                </div>
              </div>
              {user?.trial_ends_at && (
                <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800">
                  <p className="text-xs text-sky-700 dark:text-sky-300">
                    Trial ends: <strong>{new Date(user.trial_ends_at).toLocaleDateString('en-MY')}</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          {tab === 'password' && (
            <form onSubmit={handleChangePw} className="space-y-4">
              {[
                ['currentPassword','Current Password','Enter current password'],
                ['newPassword','New Password','Min. 8 characters'],
                ['confirm','Confirm New Password','Re-enter new password'],
              ].map(([name,label,placeholder]) => (
                <div key={name}>
                  <label className="label">{label}</label>
                  <input type="password" className="input" placeholder={placeholder}
                    value={pw[name]} onChange={e => setPw(p => ({...p, [name]: e.target.value}))} required />
                </div>
              ))}
              <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
                {saving ? 'Saving…' : 'Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
